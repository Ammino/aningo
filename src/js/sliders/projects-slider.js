function getCurrentTranslate(swiper) {
	const t = getComputedStyle(swiper.wrapperEl).transform;
	if (!t || t === 'none') return 0;
	const m = new DOMMatrixReadOnly(t);
	return swiper.isHorizontal() ? m.m41 : m.m42;
}

const PRFILTER_HIDE_CLASS = 'is-prfilter-hidden';
const PRFILTER_TRANSITION_MS = 400;

function slideMatchesPrFilter(slide, key) {
	if (!slide.hasAttribute('data-prvalue')) return true;
	const raw = slide.getAttribute('data-prvalue') || '';
	const vals = raw
		.split(/[\s,]+/)
		.map((s) => s.trim())
		.filter(Boolean);
	if (key === 'all') return true;
	if (!vals.length) return false;
	return vals.includes(key);
}

function snapSwiperToFirstVisibleAfterFilter(swiper, beforeSnap, alignOffsetEl) {
	if (typeof beforeSnap === 'function') beforeSnap();
	swiper.update();
	const slides = swiper.slides ? Array.from(swiper.slides) : [];
	const firstVisible = slides.findIndex((s) => !s.classList.contains(PRFILTER_HIDE_CLASS));
	const target = firstVisible === -1 ? 0 : firstVisible;
	swiper.slideTo(target, 0, false);

	// Swiper + width:0 у скрытых слайдов даёт накопление ошибки translate; выравниваем по визуальной сетке
	const activeSlide = swiper.slides && swiper.slides[swiper.activeIndex];
	if (alignOffsetEl && activeSlide) {
		const wantLeft = alignOffsetEl.getBoundingClientRect().left;
		const haveLeft = activeSlide.getBoundingClientRect().left;
		const delta = haveLeft - wantLeft;
		if (Math.abs(delta) > 0.25) {
			swiper.setTransition(0);
			swiper.setTranslate(swiper.getTranslate() - delta);
			swiper.updateProgress();
			swiper.updateSlidesClasses();
		}
	}
}

function initProjectsPrFilter(filterRoot, swiper, sliderEl, options = {}) {
	const { beforeSnap, alignOffsetEl } = options;
	const links = Array.from(filterRoot.querySelectorAll('.js--prfilter-link'));
	if (!links.length) return;

	const getSlides = () => Array.from(sliderEl.querySelectorAll('.swiper-slide'));

	const syncAfterLayout = () => {
		requestAnimationFrame(() => {
			swiper.updateProgress();
			swiper.updateSlidesClasses();
		});
	};

	const applyPrFilter = (key, { withTransition } = { withTransition: true }) => {
		const wasRunning = swiper.autoplay && swiper.autoplay.running;
		if (swiper.autoplay) swiper.autoplay.stop();

		getSlides().forEach((slide) => {
			const show = slideMatchesPrFilter(slide, key);
			if (!withTransition) {
				slide.style.transition = 'none';
			}
			slide.classList.toggle(PRFILTER_HIDE_CLASS, !show);
		});

		snapSwiperToFirstVisibleAfterFilter(swiper, beforeSnap, alignOffsetEl);

		if (!withTransition) {
			// eslint-disable-next-line no-unused-expressions
			sliderEl.offsetHeight;
			getSlides().forEach((slide) => {
				slide.style.transition = '';
			});
		}

		syncAfterLayout();

		if (withTransition) {
			window.setTimeout(() => {
				snapSwiperToFirstVisibleAfterFilter(swiper, beforeSnap, alignOffsetEl);
				syncAfterLayout();
				if (wasRunning && swiper.autoplay) swiper.autoplay.start();
			}, PRFILTER_TRANSITION_MS);
		} else if (wasRunning && swiper.autoplay) {
			swiper.autoplay.start();
		}
	};

	links.forEach((link) => {
		link.addEventListener('click', (e) => {
			e.preventDefault();
			const key = link.getAttribute('data-prvalue') || 'all';
			links.forEach((l) => l.classList.remove('active'));
			link.classList.add('active');
			applyPrFilter(key, { withTransition: true });
		});
	});

	const activeLink = links.find((l) => l.classList.contains('active'));
	const initialKey = activeLink ? activeLink.getAttribute('data-prvalue') || 'all' : 'all';
	applyPrFilter(initialKey, { withTransition: false });
}

// Бегущая строка (главная и др.): только .js--sl-projects
document.querySelectorAll('.js--sl-projects').forEach((sliderProjects) => {
	const swiperProjects = new Swiper(sliderProjects, {
		loop: true,
		autoHeight: true,
		loopAdditionalSlides: 10,
		slidesPerView: 'auto',
		spaceBetween: 10,
		speed: 9000,
		allowTouchMove: true,
		grabCursor: true,
		autoplay: {
			delay: 1,
			disableOnInteraction: false,
			waitForTransition: false,
			pauseOnMouseEnter: false, // важно
		},
		breakpoints: {
			992: { spaceBetween: 30 },
		},
	});

	sliderProjects.addEventListener('pointerenter', () => {
		const current = getCurrentTranslate(swiperProjects);

		swiperProjects.autoplay.stop();

		swiperProjects.setTransition(0);
		swiperProjects.setTranslate(current);

		swiperProjects.animating = false;
		if (typeof swiperProjects.transitionEnd === 'function') {
			swiperProjects.transitionEnd();
		}

		swiperProjects.updateProgress();
		swiperProjects.updateActiveIndex();
		swiperProjects.updateSlidesClasses();
	});

	sliderProjects.addEventListener('pointerleave', () => {
		swiperProjects.autoplay.start();
	});
});

// «Для бизнеса»: обычный горизонтальный слайдер + фильтр (без marquee)
document.querySelectorAll('.js--fb-projects').forEach((sliderEl) => {
	const offsetEl = sliderEl.closest('.projects')?.querySelector('.js--sl-projects-offset');

	const leftFbProjects = () => {
		if (!offsetEl) return 0;
		const sRect = sliderEl.getBoundingClientRect();
		const oRect = offsetEl.getBoundingClientRect();
		return Math.max(0, Math.round(oRect.left - sRect.left));
	};

	const initialOffset = leftFbProjects();

	const swiperFb = new Swiper(sliderEl, {
		loop: false,
		slidesPerView: 'auto',
		spaceBetween: 10,
		speed: 480,
		allowTouchMove: true,
		grabCursor: true,
		autoHeight: false,
		watchOverflow: false,
		slidesOffsetBefore: initialOffset,
		slidesOffsetAfter: initialOffset,
		breakpoints: {
			992: { spaceBetween: 30 },
		},
	});

	const refreshFbOffsetsParams = () => {
		const offset = leftFbProjects();
		swiperFb.params.slidesOffsetBefore = offset;
		swiperFb.params.slidesOffsetAfter = offset;
	};

	const syncFbOffsets = () => {
		refreshFbOffsetsParams();
		swiperFb.update();
		const slides = swiperFb.slides ? Array.from(swiperFb.slides) : [];
		const active = slides[swiperFb.activeIndex];
		if (!active || active.classList.contains(PRFILTER_HIDE_CLASS)) {
			snapSwiperToFirstVisibleAfterFilter(swiperFb, refreshFbOffsetsParams, offsetEl);
		} else if (swiperFb.activeIndex === 0) {
			swiperFb.slideTo(0, 0, false);
		}
	};

	let syncFbRaf = 0;
	const scheduleSyncFbOffsets = () => {
		cancelAnimationFrame(syncFbRaf);
		syncFbRaf = requestAnimationFrame(syncFbOffsets);
	};

	window.addEventListener('resize', scheduleSyncFbOffsets);
	window.addEventListener('orientationchange', scheduleSyncFbOffsets);

	const filterRoot = sliderEl.closest('section')?.querySelector('.js--prfilter');
	if (filterRoot) {
		initProjectsPrFilter(filterRoot, swiperFb, sliderEl, {
			beforeSnap: refreshFbOffsetsParams,
			alignOffsetEl: offsetEl,
		});
	}
});
