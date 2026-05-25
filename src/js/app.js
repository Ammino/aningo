// @ts-nocheck
document.addEventListener("DOMContentLoaded", function () {
	const blockHeader = document.querySelector('.js--nheader');

	gsap.registerPlugin(ScrollTrigger);
	let mediaGap = gsap.matchMedia();

	// функция для определения ширины ползунка прокрутки.
	function getScrollbarWidth() {

		const outer = document.createElement('div');
		outer.style.visibility = 'hidden';
		outer.style.overflow = 'scroll';
		outer.style.msOverflowStyle = 'scrollbar';
		document.body.appendChild(outer);

		const inner = document.createElement('div');
		outer.appendChild(inner);

		const scrollbarWidth = (outer.offsetWidth - inner.offsetWidth);
		outer.parentNode.removeChild(outer);

		return scrollbarWidth;
	}

	// Горизонтальные отступы у прокручиваемых списков; опционально — scroll к button.active
	function syncBlockWpadd(block) {
		const list = block.querySelector('.js--blockwpadd-list');
		const listOffset = block.querySelector('.js--blockwpadd--offset');
		if (!list || !listOffset) return;

		const mobileOnly = block.classList.contains('js--blockwpadd-mobile');
		const narrow = window.matchMedia('(max-width: 991.98px)').matches;
		const applyPadding = !mobileOnly || (mobileOnly && narrow);

		if (applyPadding) {
			const sidePx =
				Math.max(0, Math.round(listOffset.getBoundingClientRect().left)) +
				getScrollbarWidth() / 2;
			list.style.paddingLeft = `${sidePx}px`;
			list.style.paddingRight = `${sidePx}px`;
		} else {
			list.style.paddingLeft = '';
			list.style.paddingRight = '';
		}

		if (list.classList.contains('js--blockwpadd-slidetoactive')) {
			const btnActive = list.querySelector('button.active');
			if (btnActive) {
				const padLeft = parseFloat(getComputedStyle(list).paddingLeft) || 0;
				list.scrollTo({
					left: Math.max(0, btnActive.offsetLeft - padLeft),
					behavior: 'smooth',
				});
			}
		}
	}

	const blockswpadd = document.querySelectorAll('.js--blockwpadd');
	let blockWpaddSyncRaf = 0;
	const scheduleBlockWpaddSync = () => {
		cancelAnimationFrame(blockWpaddSyncRaf);
		blockWpaddSyncRaf = requestAnimationFrame(() => {
			blockswpadd.forEach((b) => syncBlockWpadd(b));
		});
	};

	if (blockswpadd.length) {
		blockswpadd.forEach((b) => syncBlockWpadd(b));
		window.addEventListener('resize', scheduleBlockWpaddSync);
		window.addEventListener('orientationchange', scheduleBlockWpaddSync);
	}

	// header scroll
	function checkScroll() {
		const scrollPosition = window.scrollY;
		if (blockHeader) {
			if ( scrollPosition>0 ) {
				blockHeader.classList.add('header__fixed')
			} else {
				blockHeader.classList.remove('header__fixed')
			}
		}
	}

	document.querySelectorAll('.js--linkto').forEach((link) => {
		link.addEventListener('click', (e) => {
			e.preventDefault();
			const targetId = link.getAttribute('href');
			if (!targetId || targetId.charAt(0) !== '#') return;
			const targetEl = document.querySelector(targetId);
			if (!targetEl) return;

			const headerHeight = blockHeader ? blockHeader.offsetHeight : 0;
			const gap = 20;
			const top =
				targetEl.getBoundingClientRect().top + window.scrollY - headerHeight - gap;

			window.scrollTo({
				left: 0,
				top: Math.max(0, top),
				behavior: 'smooth',
			});
		});
	});

	checkScroll()
	window.addEventListener('scroll', function () {
		checkScroll()
	})
	// /header scroll

	// функция на установку отступов, чтобы сайт не дергался при открытии модалок и прочего подобного
	function setPadd() {
		const forpadd = document.querySelectorAll('.js--setpadd');
		if (document.body.classList.contains('no-scroll')) {
			document.body.style.paddingRight = getScrollbarWidth();

			forpadd.forEach((block) => {
				block.style.paddingRight = getScrollbarWidth();
			})
		} else {
			document.body.style.paddingRight = null

			forpadd.forEach((block) => {
				block.style.paddingRight = null
			})
		}
	}

	// styled Scroll
	// base: works everywhere (previous behavior)
	Array.prototype.forEach.call(
		document.querySelectorAll('.js--styled-scroll'),
		(el) => new SimpleBar(el, {
			autoHide: false,
		})
	)

	// extra: only on mobile (<992px) — for specific blocks (e.g. filter)
	const isMobile992 = () => window.matchMedia('(max-width: 991.98px)').matches;
	if (isMobile992()) {
		Array.prototype.forEach.call(
			document.querySelectorAll('.js--styled-scroll-mob'),
			(el) => new SimpleBar(el, {
				autoHide: false,
			})
		)
	}

	// phone mask
	let inputsPhone = document.querySelectorAll(".js--maskphone");
	if (inputsPhone) {
		var phoneMask = new Inputmask("+7 (999) 999 99 99");
		phoneMask.mask(inputsPhone);
	}

	// fancybox
	Fancybox.bind("[data-fancybox]", {
		// options
	})

	// =========================
	// Swipe-to-close helper (reusable: поиск, фильтр, модалки Fancybox)
	// =========================
	window.initSwipeToCloseHandle = function initSwipeToCloseHandle(opts) {
		const {
			handleEl,
			panelEl,
			isOpen,
			isMobileView,
			onClose,
			onReset,
			thresholdPx = 120,
			velocityThreshold = 0.7,
			closeToY = 220,
			/** true: не доводить панель GSAP до нуля — сразу onClose (для Fancybox, чтобы не конфликтовать с hideClass) */
			skipClosePanelTween = false,
		} = opts || {};

		if (!handleEl || !panelEl || typeof isOpen !== 'function' || typeof isMobileView !== 'function') return;
		if (typeof gsap === 'undefined') return;

		let startY = 0;
		let currentY = 0;
		let dragging = false;
		let startTime = 0;

		const setPanelY = (y) => {
			gsap.set(panelEl, { y });
		};

		const resetPanel = () => {
			if (typeof onReset === 'function') onReset();
			else gsap.to(panelEl, { y: 0, opacity: 1, duration: 0.25, ease: 'power2.out' });
		};

		const onTouchStart = (e) => {
			if (!isOpen()) return;
			if (!isMobileView()) return;
			if (!e.touches || e.touches.length !== 1) return;

			dragging = true;
			startY = e.touches[0].clientY;
			currentY = 0;
			startTime = Date.now();
			gsap.killTweensOf(panelEl);
		};

		const onTouchMove = (e) => {
			if (!dragging) return;
			if (!e.touches || e.touches.length !== 1) return;

			const dy = e.touches[0].clientY - startY;
			currentY = Math.max(0, dy);
			setPanelY(currentY);
		};

		const onTouchEnd = () => {
			if (!dragging) return;
			dragging = false;

			const dt = Math.max(1, Date.now() - startTime);
			const velocity = currentY / dt;
			const shouldClose = currentY > thresholdPx || velocity > velocityThreshold;

			if (shouldClose) {
				if (skipClosePanelTween) {
					gsap.killTweensOf(panelEl);
					gsap.set(panelEl, { clearProps: 'transform,opacity' });
					if (typeof onClose === 'function') onClose();
				} else {
					gsap.to(panelEl, {
						y: Math.max(currentY, closeToY),
						opacity: 0,
						duration: 0.18,
						ease: 'power2.in',
						onComplete: () => {
							if (typeof onClose === 'function') onClose();
						},
					});
				}
			} else {
				resetPanel();
			}
		};

		const onTouchCancel = () => {
			if (!dragging) return;
			dragging = false;
			resetPanel();
		};

		handleEl.addEventListener('touchstart', onTouchStart, { passive: true });
		handleEl.addEventListener('touchmove', onTouchMove, { passive: true });
		handleEl.addEventListener('touchend', onTouchEnd, { passive: true });
		handleEl.addEventListener('touchcancel', onTouchCancel, { passive: true });

		return {
			destroy() {
				handleEl.removeEventListener('touchstart', onTouchStart);
				handleEl.removeEventListener('touchmove', onTouchMove);
				handleEl.removeEventListener('touchend', onTouchEnd);
				handleEl.removeEventListener('touchcancel', onTouchCancel);
				gsap.killTweensOf(panelEl);
				gsap.set(panelEl, { clearProps: 'transform,opacity' });
			},
		};
	};

	window.teardownFancyModalSwipeLast = null;

	window.attachFancyModalSwipeToSlide = function attachFancyModalSwipeToSlide(fancybox, slide) {
		if (typeof window.initSwipeToCloseHandle !== 'function' || typeof gsap === 'undefined') return;

		if (typeof window.teardownFancyModalSwipeLast === 'function') {
			window.teardownFancyModalSwipeLast();
			window.teardownFancyModalSwipeLast = null;
		}

		const slideEl = slide && slide.el;
		if (!slideEl) return;

		const handleEl = slideEl.querySelector('.modal__closemobile');
		const panelEl = slideEl.querySelector('.modal') || slideEl.querySelector('.fancybox__content');
		if (!handleEl || !panelEl) return;

		const isMobileView = () => window.matchMedia('(max-width: 991.98px)').matches;
		if (!isMobileView()) return;

		gsap.killTweensOf(panelEl);
		gsap.set(panelEl, { clearProps: 'transform,opacity' });
		gsap.set(panelEl, { y: 0, opacity: 1 });

		const api = window.initSwipeToCloseHandle({
			handleEl,
			panelEl,
			isOpen: () => !!(fancybox && typeof fancybox.isClosing === 'function' && !fancybox.isClosing()),
			isMobileView,
			skipClosePanelTween: true,
			onClose: () => {
				if (fancybox && typeof fancybox.close === 'function') fancybox.close();
			},
		});

		if (api && typeof api.destroy === 'function') {
			window.teardownFancyModalSwipeLast = api.destroy;
		}
	};

	const fancyModalAnim = {
		showClass: 'fancy-modal-show',
		hideClass: 'fancy-modal-hide',
	};

	Fancybox.bind("[data-fancybox-default]", {
		...fancyModalAnim,
		autoFocus: false,
		mainClass: 'fancy-modaldefault',
		closeButton: false,
		dragToClose: false,
		hideScrollbar: true,
		zoomEffect: false,
		on: {
			ready: () => {
				if (document.querySelector('.js--nheader')) {
					document.querySelector('.js--nheader').style.paddingRight = getScrollbarWidth();
				}
			},
			destroy: () => {
				if (typeof window.teardownFancyModalSwipeLast === 'function') {
					window.teardownFancyModalSwipeLast();
					window.teardownFancyModalSwipeLast = null;
				}
				if (document.querySelector('.js--nheader')) {
					document.querySelector('.js--nheader').style.paddingRight = null;
				}
			},
			done: (fancybox, slide) => {
				if (typeof window.attachFancyModalSwipeToSlide === 'function') {
					window.attachFancyModalSwipeToSlide(fancybox, slide);
				}
			},
		},
	})

	// parallax background
	const bgParallax = document.querySelectorAll('.js--bgparallax');
	if (bgParallax.length) {
		bgParallax.forEach((block) => {
			// Strength in px (positive number). Example: data-parallax="120"
			const amountAttr = block.getAttribute('data-parallax');
			const amount = Math.max(0, Number(amountAttr) || 120);

			const parent = block.parentElement;
			const getMaxShift = () => {
				if (!parent) return 0;
				const extra = block.getBoundingClientRect().height - parent.getBoundingClientRect().height;
				return Math.max(0, Math.floor(extra / 2));
			};

			gsap.set(block, { y: 0, willChange: 'transform' });

			gsap.fromTo(
				block,
				{ y: () => -Math.min(amount, getMaxShift()) },
				{
					y: () => Math.min(amount, getMaxShift()),
					ease: 'none',
					scrollTrigger: {
						trigger: parent || block,
						start: 'top bottom',
						end: 'bottom top',
						scrub: true,
						invalidateOnRefresh: true,
					},
				}
			);
		});
	}

	// video play on hover (desktop) / autoplay (mobile)
	const videoHoverWrappers = document.querySelectorAll('.js--videoonhover-wrapper');
	if (videoHoverWrappers.length) {
		const isHoverDevice = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

		videoHoverWrappers.forEach((wrapper) => {
			const video = wrapper.querySelector('.js--videoonhover');
			if (!video) return;

			// Common mobile requirements for autoplay
			video.muted = true;
			video.loop = true;
			video.playsInline = true;
			video.setAttribute('playsinline', '');

			const safePlay = () => {
				const p = video.play();
				if (p && typeof p.catch === 'function') p.catch(() => {});
			};

			if (isHoverDevice) {
				wrapper.addEventListener('mouseenter', () => {
					safePlay();
				});

				wrapper.addEventListener('mouseleave', () => {
					video.pause();
					try {
						video.currentTime = 0;
					} catch (e) {}
				});
			} else {
				video.autoplay = true;
				video.setAttribute('autoplay', '');
				video.preload = 'auto';

				if (video.readyState >= 2) {
					safePlay();
				} else {
					video.addEventListener('loadeddata', safePlay, { once: true });
				}
			}
		});
	}

	// search
	const search = document.querySelector('.js--search');
	if (search) {
		const searchOpenButtons = document.querySelectorAll('.js--search-btnopen');
		const searchWrapper = search.querySelector('.header-search__wrapper');
		const searchContent = search.querySelector('.js--search-content');
		const searchDefault = search.querySelector('.js--search-default');
		const searchResultsBody = search.querySelector('.js--search-resultsbody');
		const searchResultsBtn = search.querySelector('.js--search-resultsbtn');
		const searchCloseDesktop = search.querySelector('.js--search-close');
		const searchCloseMobile = search.querySelector('.js--search-mobileclose');
		const searchInput = search.querySelector('input[type="search"], input');

		const OPEN_CLASS = 'is-open';
		const OPEN_Y = 24;
		const CLOSE_Y = 28;

		const setSearchInitialState = () => {
			if (searchInput) searchInput.value = '';
			if (searchDefault) searchDefault.classList.remove('d-none');
			if (searchContent) searchContent.classList.remove('wresult');
			if (searchResultsBody) searchResultsBody.classList.add('d-none');
			if (searchResultsBtn) searchResultsBtn.classList.add('d-none');
		};

		const openSearch = () => {
			if (search.classList.contains(OPEN_CLASS)) return;

			setSearchInitialState();
			document.body.classList.add('no-scroll');
			setPadd();
			search.classList.add(OPEN_CLASS);

			if (searchWrapper) {
				gsap.killTweensOf(searchWrapper);
				gsap.set(searchWrapper, { y: OPEN_Y, opacity: 0 });
				gsap.to(searchWrapper, {
					y: 0,
					opacity: 1,
					duration: 0.28,
					ease: 'power2.out',
					onComplete: () => {
						if (searchInput) {
							searchInput.focus();
							try {
								searchInput.setSelectionRange(searchInput.value.length, searchInput.value.length);
							} catch (e) {}
						}
					}
				});
			} else if (searchInput) {
				searchInput.focus();
			}
		};

		const closeSearch = (opts = {}) => {
			const { instant = false, fromSwipe = false } = opts;
			if (!search.classList.contains(OPEN_CLASS)) return;

			const finish = () => {
				search.classList.remove(OPEN_CLASS);
				document.body.classList.remove('no-scroll');
				setPadd();
				setSearchInitialState();
				if (searchWrapper) {
					gsap.set(searchWrapper, { opacity: 0, y: OPEN_Y });
					window.setTimeout(() => {
						gsap.set(searchWrapper, { clearProps: 'transform' });
					}, 230);
				}
			};

			if (instant || !searchWrapper) {
				finish();
				return;
			}

			gsap.killTweensOf(searchWrapper);
			gsap.to(searchWrapper, {
				y: fromSwipe ? Math.max(CLOSE_Y, gsap.getProperty(searchWrapper, 'y') || 0) : CLOSE_Y,
				opacity: 0,
				duration: 0.22,
				ease: 'power2.in',
				onComplete: finish
			});
		};

		searchOpenButtons.forEach((btn) => {
			btn.addEventListener('click', (e) => {
				e.preventDefault();
				openSearch();
			});
		});

		[searchCloseDesktop, searchCloseMobile].forEach((btn) => {
			if (!btn) return;
			btn.addEventListener('click', (e) => {
				e.preventDefault();
				closeSearch();
			});
		});

		search.addEventListener('mousedown', (e) => {
			if (!search.classList.contains(OPEN_CLASS)) return;
			if (!(e.target instanceof Element)) return;
			const insideWrapper = !!e.target.closest('.header-search__wrapper');
			if (!insideWrapper) closeSearch();
		});

		// simulate search results
		if (searchInput) {
			searchInput.addEventListener('input', () => {
				const q = (searchInput.value || '').trim();
				const isActive = q.length > 2;

				if (isActive) {
					if (searchDefault) searchDefault.classList.add('d-none');
					if (searchContent) searchContent.classList.add('wresult');
					if (searchResultsBody) searchResultsBody.classList.remove('d-none');
					if (searchResultsBtn) searchResultsBtn.classList.remove('d-none');
				} else {
					if (searchDefault) searchDefault.classList.remove('d-none');
					if (searchContent) searchContent.classList.remove('wresult');
					if (searchResultsBody) searchResultsBody.classList.add('d-none');
					if (searchResultsBtn) searchResultsBtn.classList.add('d-none');
				}
			});
		}

		// swipe-to-close on mobile (drag handle)
		if (searchCloseMobile && searchWrapper && typeof window.initSwipeToCloseHandle === 'function') {
			window.initSwipeToCloseHandle({
				handleEl: searchCloseMobile,
				panelEl: searchWrapper,
				isOpen: () => search.classList.contains(OPEN_CLASS),
				isMobileView: () => window.matchMedia('(max-width: 991.98px)').matches,
				onClose: () => closeSearch({ fromSwipe: true }),
			});
		}
	}


	@@include('./components/_tabs.js');
	@@include('./components/_faq.js');
	@@include('./components/_services-filter.js');
	@@include('./components/_video.js');
	@@include('./components/_modalmenu.js');
	@@include('./components/_form.js');
	@@include('./components/_formsteps.js');
	@@include('./components/_filter.js');
	@@include('./components/_page404.js');
	@@include('./sliders/partners-slider.js');
	@@include('./sliders/projects-slider.js');
	@@include('./sliders/reviews-slider.js');
	@@include('./sliders/headercatalog-slider.js');
	@@include('./sliders/catalog-slider.js');
	@@include('./sliders/offers-slider.js');
	@@include('./sliders/card-slider.js');
	@@include('./sliders/category-slider.js');
	@@include('./sliders/compositions-slider.js');
	@@include('./sliders/blog-slider.js');

	@@include('./components/_calculator.js');

	@@include('./maps/yandex-map-presets.js');
	@@include('./maps/yandex-maps.js');
})




