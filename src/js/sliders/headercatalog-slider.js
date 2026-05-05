const sliderCatalog = document.querySelector('.js--sl-headercatalog');

if (sliderCatalog) {
	const sliderCatalogOffset = document.querySelector('.js--sl-headercatalog-offset');
	const sliderPrev = document.querySelector('.js--sl-headercatalog-prev');
	const sliderNext = document.querySelector('.js--sl-headercatalog-next');

	const leftCatalog = () => {
		if (!sliderCatalogOffset) return 0;
		return sliderCatalogOffset.offsetLeft + getScrollbarWidth() / 2;
	};

	const isMobile = () => window.innerWidth < 992;

	const swiperProjects = new Swiper(sliderCatalog, {
		loop: false,
		slidesPerView: 'auto',
		autoHeight: true,
		speed: 1000,
		spaceBetween: 5,
		slidesPerGroup: 1,
		slidesPerGroupAuto: true,
		slidesOffsetBefore: isMobile() ? leftCatalog() : 0,
		slidesOffsetAfter: isMobile() ? leftCatalog() : 0,

		breakpoints: {
			992: {
				spaceBetween: 10,
			},
		},

		navigation: {
            disabledClass: 'disabled',
			prevEl: sliderPrev,
			nextEl: sliderNext,
		},
	});

	const pageStep = () => Math.max(1, swiperProjects.slidesPerViewDynamic());
	const slidePage = (dir) => {
		const step = pageStep();
		const target = Math.min(
			swiperProjects.slides.length - 1,
			Math.max(0, swiperProjects.activeIndex + dir * step)
		);
		swiperProjects.slideTo(target);
	};

	if (sliderPrev) {
		sliderPrev.addEventListener('click', (e) => {
			e.preventDefault();
			slidePage(-1); 
		});
	}

	if (sliderNext) {
		sliderNext.addEventListener('click', (e) => {
			e.preventDefault();
			slidePage(1);
		});
	}

	const syncOffsets = () => {
		const offset = isMobile() ? leftCatalog() : 0;
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
