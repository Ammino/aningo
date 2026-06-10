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


	// tabs
const TABS_SCROLL_HEADER_GAP = 30;

function getTabsScrollOffset() {
	const header = document.querySelector('.js--nheader');
	return (header ? header.offsetHeight : 0) + TABS_SCROLL_HEADER_GAP;
}

function scrollPageToTabsBlock(tabsRoot) {
	const top =
		tabsRoot.getBoundingClientRect().top + window.scrollY - getTabsScrollOffset();
	window.scrollTo({
		top: Math.max(0, top),
		behavior: 'smooth',
	});
}

document.querySelectorAll('.js--tabs-link').forEach((btn) => {
	btn.addEventListener('click', (event) => {
		event.preventDefault();

		if (btn.classList.contains('active')) return;

		const tabId = btn.getAttribute('data-tab');
		if (!tabId) return;

		const root = btn.closest('.js--tabs');
		if (!root) return;

		const escaped = typeof CSS !== 'undefined' && CSS.escape ? CSS.escape(tabId) : tabId;
		const nextPanel = root.querySelector(`#${escaped}`);
		if (!nextPanel) return;

		root.querySelectorAll('.js--tabs-link.active').forEach((el) => el.classList.remove('active'));
		root.querySelectorAll('.js--tabs-item.active').forEach((el) => el.classList.remove('active'));

		btn.classList.add('active');
		nextPanel.classList.add('active');

		scrollPageToTabsBlock(root);
	});
});
// /tabs;
	(() => {
	const cards = document.querySelectorAll('.js--faq');
	if (!cards.length) return;

	const setExpanded = (card, title, slide, expanded) => {
		if (expanded) {
			card.classList.add('active');
			slide.style.maxHeight = `${slide.scrollHeight}px`;
			title.setAttribute('aria-expanded', 'true');
		} else {
			card.classList.remove('active');
			slide.style.maxHeight = null;
			title.setAttribute('aria-expanded', 'false');
		}
	};

	cards.forEach((card) => {
		const title = card.querySelector('.js--faq-title');
		const slide = card.querySelector('.js--faq-slide');
		if (!title || !slide) return;

		if (!title.hasAttribute('role')) title.setAttribute('role', 'button');
		if (!title.hasAttribute('tabindex')) title.setAttribute('tabindex', '0');

		const initiallyOpen = card.classList.contains('active');
		title.setAttribute('aria-expanded', initiallyOpen ? 'true' : 'false');
		if (initiallyOpen) {
			slide.style.maxHeight = `${slide.scrollHeight}px`;
		}

		title.addEventListener('click', (e) => {
			e.preventDefault();
			const willOpen = !card.classList.contains('active');
			setExpanded(card, title, slide, willOpen);
		});

		title.addEventListener('keydown', (e) => {
			if (e.key !== 'Enter' && e.key !== ' ') return;
			e.preventDefault();
			title.click();
		});
	});

	let resizeRaf = 0;
	window.addEventListener('resize', () => {
		if (resizeRaf) cancelAnimationFrame(resizeRaf);
		resizeRaf = requestAnimationFrame(() => {
			document.querySelectorAll('.js--faq.active .js--faq-slide').forEach((slide) => {
				slide.style.maxHeight = `${slide.scrollHeight}px`;
			});
		});
	});
})();
;
	(() => {
	const FILTER_ROOT = '.js--sfilter';
	const LINK_SELECTOR = '.js--sfilter-link';
	const ITEM_SELECTOR = '.js--sfilter-item';
	const TRIGGER_SELECTOR = '.js--sfilter-trigger';
	const SLIDE_SELECTOR = '.js--sfilter-slide';
	const HIDDEN_CLASS = 'd-none';
	const COLLAPSED_CLASS = 'is-sfilter-collapsed';
	const TRANSITION_MS = 280;
	const FILTER_SCROLL_HEADER_GAP = 30;

	const getFilterScrollOffset = () => {
		const header = document.querySelector('.js--nheader');
		return (header ? header.offsetHeight : 0) + FILTER_SCROLL_HEADER_GAP;
	};

	const scrollPageToFilterBlock = (filterRoot) => {
		const top =
			filterRoot.getBoundingClientRect().top + window.scrollY - getFilterScrollOffset();
		window.scrollTo({
			top: Math.max(0, top),
			behavior: 'smooth',
		});
	};

	const parseValues = (el) => {
		// canonical: data-svalue (like services.pug); fallback: data-sfilter (for legacy markup)
		const raw = el.getAttribute('data-svalue') || el.getAttribute('data-sfilter') || '';
		return raw
			.split(/[\s,]+/)
			.map((s) => s.trim())
			.filter(Boolean);
	};

	const collapseItemPanel = (item) => {
		item.classList.remove('active');
		const slide = item.querySelector(SLIDE_SELECTOR);
		if (slide) slide.style.maxHeight = null;
		const trigger = item.querySelector(TRIGGER_SELECTOR);
		if (trigger && trigger.hasAttribute('aria-expanded')) {
			trigger.setAttribute('aria-expanded', 'false');
		}
	};

	const hideItem = (item) => {
		if (item.classList.contains(HIDDEN_CLASS)) return;

		// стартовое состояние для max-height transition
		item.classList.remove(COLLAPSED_CLASS);
		item.style.maxHeight = `${item.scrollHeight}px`;

		// принудительный reflow, чтобы браузер зафиксировал max-height
		// eslint-disable-next-line no-unused-expressions
		item.offsetHeight;

		item.classList.add(COLLAPSED_CLASS);

		window.setTimeout(() => {
			item.classList.add(HIDDEN_CLASS);
			item.style.maxHeight = '';
		}, TRANSITION_MS);
	};

	const showItem = (item) => {
		if (!item.classList.contains(HIDDEN_CLASS)) return;

		item.classList.remove(HIDDEN_CLASS);
		item.classList.add(COLLAPSED_CLASS);
		item.style.maxHeight = '0px';

		// eslint-disable-next-line no-unused-expressions
		item.offsetHeight;

		item.classList.remove(COLLAPSED_CLASS);
		item.style.maxHeight = `${item.scrollHeight}px`;

		window.setTimeout(() => {
			item.style.maxHeight = '';
		}, TRANSITION_MS);
	};

	const getFilterScope = (root) =>
		root.closest('.tabs') || root.closest('section') || root.parentElement || document;

	const initFilter = (root) => {
		const links = Array.from(root.querySelectorAll(LINK_SELECTOR));
		const scope = getFilterScope(root);
		const items = Array.from(scope.querySelectorAll(ITEM_SELECTOR));
		if (!links.length || !items.length) return;

		const applyFilter = (key) => {
			items.forEach((item) => {
				const vals = parseValues(item);
				const show = key === 'all' || vals.includes(key);
				if (show) {
					showItem(item);
				} else {
					collapseItemPanel(item);
					hideItem(item);
				}
			});
		};

		links.forEach((link) => {
			link.addEventListener('click', (e) => {
				e.preventDefault();
				const key = link.getAttribute('data-sfilter') || 'all';
				links.forEach((l) => l.classList.remove('active'));
				link.classList.add('active');
				applyFilter(key);
				scrollPageToFilterBlock(root);
			});
		});

		const activeLink = links.find((l) => l.classList.contains('active'));
		const initialKey = activeLink ? activeLink.getAttribute('data-sfilter') || 'all' : 'all';
		applyFilter(initialKey);
	};

	document.querySelectorAll(FILTER_ROOT).forEach((root) => initFilter(root));
})();
;
	// video blocks
(() => {
	const roots = document.querySelectorAll('.js--video');
	if (!roots.length) return;

	let activeRoot = null;

	const getEls = (root) => {
		const video = root.querySelector('.js--video-player');
		const btn = root.querySelector('.js--video-play');
		return { video, btn };
	};

	const setUiStopped = (root) => {
		const { video, btn } = getEls(root);
		if (!video) return;

		root.classList.remove('is-video-playing');
		video.controls = false;
		if (btn) btn.hidden = false;
	};

	const setUiPlaying = (root) => {
		const { video, btn } = getEls(root);
		if (!video) return;

		root.classList.add('is-video-playing');
		video.controls = true;
		if (btn) btn.hidden = true;
	};

	const stopIfActive = (root) => {
		const { video } = getEls(root);
		if (!video) return;

		if (!video.paused && !video.ended) {
			video.pause();
		}
		setUiStopped(root);
	};

	const stopAllExcept = (nextRoot) => {
		roots.forEach((r) => {
			if (r !== nextRoot) stopIfActive(r);
		});
	};

	roots.forEach((root) => {
		const { video, btn } = getEls(root);
		if (!video) return;

		setUiStopped(root);

		if (btn) {
			btn.addEventListener('click', async (e) => {
				e.preventDefault();

				stopAllExcept(root);
				activeRoot = root;
				setUiPlaying(root);

				try {
					await video.play();
				} catch (err) {
					// Autoplay restrictions or other playback errors — revert UI
					setUiStopped(root);
				}
			});
		}

		video.addEventListener('pause', () => {
			setUiStopped(root);
			if (activeRoot === root) activeRoot = null;
		});

		video.addEventListener('ended', () => {
			setUiStopped(root);
			if (activeRoot === root) activeRoot = null;
		});

		video.addEventListener('play', () => {
			stopAllExcept(root);
			activeRoot = root;
			setUiPlaying(root);
		});
	});
})();
;
	// mobile nav menu
const navBtn = document.querySelector('.js--mobilemenu-btn');
const nav = document.querySelector('.js--mobilemenu');

if (navBtn) {
	navBtn.onclick = function () {
		nav.classList.toggle('mobilemenu__opened');
		navBtn.classList.toggle('active');
		document.body.classList.toggle('no-scroll');

        let popupOpened = document.querySelector('.mobilemenu__popup__opened');
        if (popupOpened) {
            popupOpened.classList.remove('mobilemenu__popup__opened');
        }
	}
}
;
	// input text
const inputText = document.querySelectorAll('.js--input-text');
if (inputText && inputText.length) {
	const updateIwtext = (input) => {
		const hasValue = typeof input.value === 'string' ? input.value.trim().length > 0 : Boolean(input.value);
		input.classList.toggle('iwtext', hasValue);
	};

	inputText.forEach((input) => {
		input.addEventListener('input', () => updateIwtext(input));
		input.addEventListener('change', () => updateIwtext(input));
		input.addEventListener('focus', () => updateIwtext(input));
		input.addEventListener('animationstart', () => updateIwtext(input));

		updateIwtext(input);
		setTimeout(() => updateIwtext(input), 0);
	});

	window.addEventListener('pageshow', () => {
		inputText.forEach((input) => updateIwtext(input));
	});
}

// nselect
const nselects = document.querySelectorAll('.js--nselect');
if (nselects && nselects.length) {
	const OPEN_CLASS = 'active';

	const closeAllNselects = (exceptEl = null) => {
		nselects.forEach((ns) => {
			if (exceptEl && ns === exceptEl) return;
			ns.classList.remove(OPEN_CLASS);
		});
	};

	const setNselectLabel = (nselect) => {
		const label = nselect.querySelector('.js--nselect-label');
		if (!label) return;

		const labelTextEl = label.querySelector('.js--nselect-label-text');
		const defaultText =
			label.getAttribute('data-text') ||
			(labelTextEl ? labelTextEl.textContent : label.textContent) ||
			'';
		const activeOption = nselect.querySelector('.js--nselect-option.active');

		if (!activeOption || activeOption.classList.contains('default')) {
			if (labelTextEl) {
				labelTextEl.textContent = defaultText;
			} else {
				label.textContent = defaultText;
			}
			return;
		}

		const nextText = (activeOption.textContent || '').trim();
		if (labelTextEl) {
			labelTextEl.textContent = nextText;
		} else {
			label.textContent = nextText;
		}
	};

	nselects.forEach((nselect) => {
		// Normalize initial state (only one active)
		const activeOptions = nselect.querySelectorAll('.js--nselect-option.active');
		if (activeOptions.length > 1) {
			activeOptions.forEach((opt, idx) => {
				if (idx > 0) opt.classList.remove('active');
			});
		}

		setNselectLabel(nselect);

		const label = nselect.querySelector('.js--nselect-label');
		if (label) {
			label.addEventListener('click', (e) => {
				e.preventDefault();
				e.stopPropagation();

				const willOpen = !nselect.classList.contains(OPEN_CLASS);
				closeAllNselects(willOpen ? nselect : null);
				nselect.classList.toggle(OPEN_CLASS, willOpen);
			});
		}

		nselect.addEventListener('click', (e) => {
			const option = e.target instanceof Element ? e.target.closest('.js--nselect-option') : null;
			if (!option) return;
			if (!nselect.contains(option)) return;

			e.preventDefault();

			const options = nselect.querySelectorAll('.js--nselect-option');
			options.forEach((opt) => opt.classList.remove('active'));
			option.classList.add('active');

			setNselectLabel(nselect);
			nselect.classList.remove(OPEN_CLASS);
		});
	});

	document.addEventListener('click', (e) => {
		const t = e.target instanceof Element ? e.target : null;
		if (!t) return;
		if (t.closest('.js--nselect')) return;
		closeAllNselects();
	});
}

// подсветка на странице каталога
const backlightInput = document.querySelectorAll('.js--backlight');
if (backlightInput && backlightInput.length) {
	const backlightImgs = document.querySelectorAll('.js--backlight-img');

	const syncBacklightClass = () => {
		const isOn = Array.from(backlightInput).some((el) => el && el.checked);
		document.body.classList.toggle('backlight', isOn);

		if (backlightImgs && backlightImgs.length) {
			backlightImgs.forEach((imgWrap) => {
				imgWrap.classList.toggle('is-active', isOn);
				imgWrap.setAttribute('aria-hidden', isOn ? 'false' : 'true');
			});
		}
	};

	// initial state
	syncBacklightClass();

	// change state
	backlightInput.forEach((input) => {
		input.addEventListener('change', syncBacklightClass);
	});
}

// счетчик количества товара в корзине
const cartCounters = document.querySelectorAll('.js--inputcount');
if (cartCounters && cartCounters.length) {
	cartCounters.forEach((box) => {
		const btnMinus = box.querySelector('.js--inputcount-minus');
		const btnPlus  = box.querySelector('.js--inputcount-plus');
		const input    = box.querySelector('.js--inputcount-input');

		if (!input || !btnMinus || !btnPlus) return;

		const getMin = () => (input.min !== '' ? Number(input.min) : 0);
		const getMax = () => (input.max !== '' ? Number(input.max) : Infinity);
		const getStep = () => (input.step !== '' ? Number(input.step) : 1);

		const clamp = (v) => {
		const min = getMin();
		const max = getMax();

		if (!Number.isFinite(v)) v = min;
		if (v < min) v = min;
		if (v > max) v = max;

		return v;
		};

		const readValue = () => {
		const raw = input.value.trim();
		if (raw === '') return NaN;
		return Number.parseInt(raw, 10); // если нужны дробные — замени на parseFloat
		};

		const updateButtons = (v = clamp(readValue())) => {
		const min = getMin();
		const max = getMax();

		btnMinus.disabled = v <= min;
		btnPlus.disabled  = v >= max;
		};

		const writeValue = (v) => {
		const fixed = clamp(v);
		input.value = String(fixed);
		updateButtons(fixed);
		};

		// init
		writeValue(clamp(readValue()));

		btnMinus.addEventListener('click', () => {
		writeValue(clamp(readValue()) - getStep());
		});

		btnPlus.addEventListener('click', () => {
		writeValue(clamp(readValue()) + getStep());
		});

		input.addEventListener('input', () => {
		const v = readValue();
		if (Number.isFinite(v)) updateButtons(clamp(v));
		});

		const fixManual = () => {
		const v = readValue();
		writeValue(Number.isFinite(v) ? v : getMin());
		};

		input.addEventListener('change', fixManual);
		input.addEventListener('blur', fixManual);
	});
}


// мастер чекбоксов
const containers = document.querySelectorAll('.js--mastercheck-container');

if (containers && containers.length) {
	containers.forEach((container) => {
		const master = container.querySelector('input[type="checkbox"].js--mastercheck');

		if (master) {
			const getGroup = () =>
				Array.from(container.querySelectorAll('input[type="checkbox"].js--groupcheck'))
				.filter(cb => !cb.disabled);

			const updateMaster = () => {
				const group = getGroup();

				if (group.length === 0) {
					master.checked = false;
					master.indeterminate = false;
				} else {
					const checkedCount = group.filter(cb => cb.checked).length;
					master.checked = checkedCount === group.length;
					master.indeterminate = checkedCount > 0 && checkedCount < group.length;
				}
			};

			// Мастер -> группа
			master.addEventListener('change', () => {
				const group = getGroup();
				group.forEach(cb => { cb.checked = master.checked; });
				master.indeterminate = false;
			});

			// Группа -> мастер (делегирование внутри контейнера)
			container.addEventListener('change', (e) => {
				const t = e.target;
				if (!(t instanceof HTMLInputElement)) return;
				if (t.type !== 'checkbox') return;
				if (!t.classList.contains('js--groupcheck')) return;

				updateMaster();
			});

			// Инициализация
			updateMaster();
		}
	});
}
;
	// Форма с шагами
(function () {
  'use strict';

  function FormSteps(container) {
    this.container = container;
    this.form = container.querySelector('.js--formsteps form');
    this.steps = Array.from(container.querySelectorAll('.js--formsteps-step'));
    this.prevBtn = container.querySelector('.js--formsteps-prev');
    this.nextBtn = container.querySelector('.js--formsteps-next');
    this.counterEl = container.querySelector('.js--formsteps-counter');
    this.progressLine = container.querySelector('.js--formsteps-progress');
    this.currentIndex = 0;
    this.totalSteps = this.steps.length;

    this.init();
  }

  FormSteps.prototype.init = function () {
    if (this.totalSteps === 0) return;

    this.updateView();
    this.bindEvents();
    this.updateCounter();
    this.updateProgress();
  };

  FormSteps.prototype.bindEvents = function () {
    var self = this;

    if (this.prevBtn) {
      this.prevBtn.addEventListener('click', function (e) {
        e.preventDefault();
        self.prev();
      });
    }

    if (this.nextBtn) {
      this.nextBtn.addEventListener('click', function (e) {
        e.preventDefault();
        self.next();
      });
    }
  };

  FormSteps.prototype.prev = function () {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.updateView();
      this.updateCounter();
      this.updateProgress();
    }
  };

  FormSteps.prototype.next = function () {
    if (this.currentIndex < this.totalSteps - 1) {
      this.currentIndex++;
      this.updateView();
      this.updateCounter();
      this.updateProgress();
    } else {
      // Если это последний шаг, можно отправить форму
      this.submitForm();
    }
  };

  FormSteps.prototype.updateView = function () {
    var self = this;

    this.steps.forEach(function (slide, index) {
      if (index === self.currentIndex) {
        slide.classList.add('active');
      } else {
        slide.classList.remove('active');
      }
    });

    // Обновляем состояние кнопок
    if (this.prevBtn) {
      if (this.currentIndex === 0) {
        this.prevBtn.disabled = true;
      } else {
        this.prevBtn.disabled = false;
      }
    }

    if (this.nextBtn) {
      var nextText = this.currentIndex === this.totalSteps - 1 ? 'Отправить' : 'Дальше';
      var nextSpan = this.nextBtn.querySelector('span');
      if (nextSpan) nextSpan.textContent = nextText;
    }
  };

  FormSteps.prototype.updateCounter = function () {
    if (this.counterEl) {
      this.counterEl.textContent = (this.currentIndex + 1) + '/' + this.totalSteps;
    }
  };

  FormSteps.prototype.updateProgress = function () {
    if (this.progressLine && this.totalSteps > 0) {
      var percent = ((this.currentIndex + 1) / this.totalSteps) * 100;
      this.progressLine.style.width = percent + '%';
    }
  };

  FormSteps.prototype.submitForm = function () {
    if (this.form) {
      // Здесь можно добавить валидацию перед отправкой
      console.log('Форма отправлена');
      this.form.submit();
    }
  };

  // Инициализация при загрузке DOM
  function initFormSteps() {
    var containers = document.querySelectorAll('.js--formsteps');
    if (!containers.length) return;

    containers.forEach(function (container) {
      new FormSteps(container);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFormSteps);
  } else {
    initFormSteps();
  }
})();
;
	(() => {
	const HIDDEN_CLASS = 'd-none';
	const ACTIVE_CLASS = 'active';

	// =========================
	// Filter lists ("show all")
	// =========================
	const initFilterLists = () => {
		const LIST_SELECTOR = '.js--filterlist';
		const FOOTER_SELECTOR = '.js--filterlist-footer';
		const TOGGLE_SELECTOR = '.js--filterlist-more';
		const VISIBLE_ITEMS = 5;

		const getDirectChildren = (parent, selector) => {
			if (!parent) return [];
			return Array.from(parent.children).filter(
				(el) => el instanceof Element && el.matches(selector)
			);
		};

		const setupList = (list) => {
			const footer = getDirectChildren(list, FOOTER_SELECTOR)[0] || null;
			const toggle = footer ? footer.querySelector(TOGGLE_SELECTOR) : null;

			const items = Array.from(list.children).filter((el) => {
				if (!(el instanceof Element)) return false;
				if (footer && el === footer) return false;
				return el.matches('li, .js--filterlist-item');
			});

			if (!items.length) {
				if (footer) footer.classList.add(HIDDEN_CLASS);
				return;
			}

			const hasOverflow = items.length > VISIBLE_ITEMS;
			if (!hasOverflow) {
				if (footer) footer.classList.add(HIDDEN_CLASS);
				if (toggle) toggle.classList.remove(ACTIVE_CLASS);
				return;
			}

			if (footer) footer.classList.remove(HIDDEN_CLASS);

			const setExpanded = (expanded) => {
				items.forEach((item, idx) => {
					const shouldHide = !expanded && idx >= VISIBLE_ITEMS;
					item.classList.toggle(HIDDEN_CLASS, shouldHide);
				});

				if (toggle) {
					toggle.classList.toggle(ACTIVE_CLASS, expanded);
					toggle.setAttribute('aria-expanded', expanded ? 'true' : 'false');
				}
			};

			setExpanded(false);

			if (!toggle) return;
			toggle.setAttribute('role', 'button');
			toggle.setAttribute('aria-expanded', 'false');

			toggle.addEventListener('click', (e) => {
				e.preventDefault();
				const expanded = toggle.classList.contains(ACTIVE_CLASS);
				setExpanded(!expanded);
			});
		};

		const lists = Array.from(document.querySelectorAll(LIST_SELECTOR));
		if (!lists.length) return;
		lists.forEach((list) => setupList(list));
	};

	// =========================
	// Filter range (price from/to)
	// =========================
	const initFilterRanges = () => {
		const RANGE_SELECTOR = '.js--filterrange';

		const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

		const parseNum = (v) => {
			const s = String(v ?? '').replace(/[^\d.-]/g, '');
			const n = Number(s);
			return Number.isFinite(n) ? n : null;
		};

		const formatInt = (n) => String(Math.round(Number(n) || 0));
		const formatPrice = (n) => {
			const v = Math.round(Number(n) || 0);
			const s = new Intl.NumberFormat('ru-RU').format(v).replace(/\u00A0/g, ' ');
			return `${s} ₽`;
		};

		const setTrackVars = (wrap, min, max, from, to) => {
			const span = Math.max(1, max - min);
			const p1 = ((from - min) / span) * 100;
			const p2 = ((to - min) / span) * 100;
			wrap.style.setProperty('--min', String(min));
			wrap.style.setProperty('--max', String(max));
			wrap.style.setProperty('--from', String(from));
			wrap.style.setProperty('--to', String(to));
			wrap.style.setProperty('--from-p', `${p1}%`);
			wrap.style.setProperty('--to-p', `${p2}%`);
		};

		const setupRange = (wrap) => {
			const card = wrap.closest('.js--filtercard') || wrap.parentElement;
			const inputFrom = card ? card.querySelector('.js--filterrange-from') : null;
			const inputTo = card ? card.querySelector('.js--filterrange-to') : null;

			const rMin = wrap.querySelector('.js--filterrange-min');
			const rMax = wrap.querySelector('.js--filterrange-max');
			if (!(rMin instanceof HTMLInputElement) || !(rMax instanceof HTMLInputElement)) return;

			const min = Number(wrap.dataset.min ?? 0);
			const max = Number(wrap.dataset.max ?? 0);
			const step = Math.max(1, Number(wrap.dataset.step ?? 1));
			if (!Number.isFinite(min) || !Number.isFinite(max) || max <= min) return;

			// Initialize range inputs
			[rMin, rMax].forEach((r) => {
				r.min = String(min);
				r.max = String(max);
				r.step = String(step);
			});

			// Initial state: from=min, to=max (ignore prefilled inputs)
			let from = min;
			let to = max;

			const apply = (nextFrom, nextTo, source) => {
				let f = clamp(nextFrom, min, max);
				let t = clamp(nextTo, min, max);

				if (f > t) [f, t] = [t, f];

				from = f;
				to = t;

				rMin.value = formatInt(from);
				rMax.value = formatInt(to);
				if (inputFrom instanceof HTMLInputElement) inputFrom.value = formatPrice(from);
				if (inputTo instanceof HTMLInputElement) inputTo.value = formatPrice(to);

				setTrackVars(wrap, min, max, from, to);
			};

			// Initial render
			apply(from, to);

			rMin.addEventListener('input', () => {
				apply(Number(rMin.value), to, 'min');
			});
			rMax.addEventListener('input', () => {
				apply(from, Number(rMax.value), 'max');
			});

			// If user types in inputs — reflect to sliders immediately
			if (inputFrom instanceof HTMLInputElement) {
				inputFrom.addEventListener('input', () => {
					const n = parseNum(inputFrom.value);
					if (n === null) return;
					apply(n, to, 'min');
				});
			}
			if (inputTo instanceof HTMLInputElement) {
				inputTo.addEventListener('input', () => {
					const n = parseNum(inputTo.value);
					if (n === null) return;
					apply(from, n, 'max');
				});
			}
		};

		const wraps = Array.from(document.querySelectorAll(RANGE_SELECTOR));
		if (!wraps.length) return;
		wraps.forEach((w) => setupRange(w));
	};

	// =========================
	// Filter cards accordion
	// =========================
	const initFilterCards = () => {
		const titles = Array.from(document.querySelectorAll('.js--filtercard-title'));
		if (!titles.length) return;

		titles.forEach((title) => {
			title.addEventListener('click', () => {
				const card = title.closest('.js--filtercard');
				if (!card) return;
				const slide = card.querySelector('.js--filtercard-slide');
				if (!slide) return;

				card.classList.toggle(ACTIVE_CLASS);
			});
		});
	};

	// =========================
	// Sidefilter show/hide (desktop)
	// =========================
	const initSidefilterToggle = () => {
		const btn = document.querySelector('.js--sidefilter-btnshow');
		if (!btn) return;

		const columns = btn.closest('.pageinside__columns');
		if (!columns) return;

		const labelSpans = Array.from(btn.querySelectorAll('span'));
		const labelHide = labelSpans[0] || null; // "Скрыть фильтры"
		const labelShow = labelSpans[1] || null; // "Показать фильтры"

		const CLASS_HIDDEN = 'is-sidefilter-hidden';

		const setUi = (hidden) => {
			columns.classList.toggle(CLASS_HIDDEN, hidden);
			btn.setAttribute('aria-pressed', hidden ? 'true' : 'false');

			if (labelHide) labelHide.classList.toggle(HIDDEN_CLASS, hidden);
			if (labelShow) labelShow.classList.toggle(HIDDEN_CLASS, !hidden);
		};

		setUi(columns.classList.contains(CLASS_HIDDEN));

		btn.addEventListener('click', (e) => {
			e.preventDefault();
			const nextHidden = !columns.classList.contains(CLASS_HIDDEN);
			setUi(nextHidden);
		});
	};

	// =========================
	// Sidefilter open/close (mobile, <992px) — like search
	// =========================
	const initSidefilterMobile = () => {
		const sidefilter = document.querySelector('.js--sidefilter');
		if (!sidefilter) return;

		const openButtons = Array.from(document.querySelectorAll('.js--filter-btnopen'));
		if (!openButtons.length) return;

		const wrapper = sidefilter.querySelector('.sidefilter__wrapper');
		const closeHandle = sidefilter.querySelector('.js--sidefilter-close');

		const OPEN_CLASS = 'is-open';
		const OPEN_Y = 24;
		const CLOSE_Y = 28;

		const isMobileView = () => window.matchMedia('(max-width: 991.98px)').matches;

		const open = () => {
			if (!isMobileView()) return;
			if (sidefilter.classList.contains(OPEN_CLASS)) return;

			document.body.classList.add('no-scroll');
			if (typeof setPadd === 'function') setPadd();
			sidefilter.classList.add(OPEN_CLASS);

			if (wrapper && typeof gsap !== 'undefined') {
				gsap.killTweensOf(wrapper);
				gsap.set(wrapper, { y: OPEN_Y, opacity: 0 });
				gsap.to(wrapper, { y: 0, opacity: 1, duration: 0.28, ease: 'power2.out' });
			}
		};

		const close = (opts = {}) => {
			const { instant = false } = opts;
			if (!sidefilter.classList.contains(OPEN_CLASS)) return;

			const finish = () => {
				sidefilter.classList.remove(OPEN_CLASS);
				document.body.classList.remove('no-scroll');
				if (typeof setPadd === 'function') setPadd();
				if (wrapper && typeof gsap !== 'undefined') {
					gsap.set(wrapper, { opacity: 0, y: OPEN_Y });
					window.setTimeout(() => {
						gsap.set(wrapper, { clearProps: 'transform' });
					}, 230);
				}
			};

			if (instant || !wrapper || typeof gsap === 'undefined') {
				finish();
				return;
			}

			gsap.killTweensOf(wrapper);
			gsap.to(wrapper, {
				y: CLOSE_Y,
				opacity: 0,
				duration: 0.22,
				ease: 'power2.in',
				onComplete: finish
			});
		};

		openButtons.forEach((btn) => {
			btn.addEventListener('click', (e) => {
				e.preventDefault();
				open();
			});
		});

		// swipe-to-close on mobile (drag handle) — same idea as search
		if (closeHandle && wrapper && typeof window.initSwipeToCloseHandle === 'function') {
			window.initSwipeToCloseHandle({
				handleEl: closeHandle,
				panelEl: wrapper,
				isOpen: () => sidefilter.classList.contains(OPEN_CLASS),
				isMobileView: () => window.matchMedia('(max-width: 991.98px)').matches,
				onClose: () => close({ instant: true }),
			});
		}

		// click on backdrop closes (but not inside wrapper)
		sidefilter.addEventListener('mousedown', (e) => {
			if (!isMobileView()) return;
			if (!sidefilter.classList.contains(OPEN_CLASS)) return;
			if (!(e.target instanceof Element)) return;
			const insideWrapper = !!e.target.closest('.sidefilter__wrapper');
			if (!insideWrapper) close();
		});

		// ESC closes
		document.addEventListener('keydown', (e) => {
			if (e.key !== 'Escape') return;
			if (!isMobileView()) return;
			close();
		});
	};

	// =========================
	// Boot
	// =========================
	const init = () => {
		initFilterLists();
		initFilterRanges();
		initFilterCards();
		initSidefilterToggle();
		initSidefilterMobile();
	};

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', init);
	} else {
		init();
	}
})();

;
	/**
 * Общие утилиты валидации контактной формы в калькуляторах
 */

function getStepErrorElement(stepContent, className) {
	if (!stepContent) return null;

	let errorEl = stepContent.querySelector(`.${className}`);
	if (!errorEl) {
		errorEl = document.createElement('div');
		errorEl.className = `form__info ${className}`;
		errorEl.style.display = 'none';
		stepContent.appendChild(errorEl);
	}
	return errorEl;
}

function showFormError(errorEl, message) {
	if (!errorEl) return;
	errorEl.textContent = message;
	errorEl.classList.add('error');
	errorEl.style.display = 'block';
}

function hideFormError(errorEl) {
	if (!errorEl) return;
	errorEl.textContent = '';
	errorEl.classList.remove('error');
	errorEl.style.display = 'none';
}

function validateContactFields(contactsRoot) {
	if (!contactsRoot) return false;

	const fields = contactsRoot.querySelectorAll('input, textarea, select');
	let firstInvalid = null;
	let isValid = true;

	fields.forEach(field => {
		field.classList.remove('error');

		if (!field.checkValidity()) {
			isValid = false;
			field.classList.add('error');
			if (!firstInvalid) firstInvalid = field;
		}
	});

	if (firstInvalid) {
		firstInvalid.focus();
		if (typeof firstInvalid.reportValidity === 'function') {
			firstInvalid.reportValidity();
		}
	}

	return isValid;
}

function collectContactFields(contactsRoot) {
	if (!contactsRoot) {
		return { name: '', phone: '', consent: false };
	}

	return {
		name: contactsRoot.querySelector('[name="NAME"]')?.value.trim() || '',
		phone: contactsRoot.querySelector('[name="PHONE"]')?.value.trim() || '',
		consent: Boolean(contactsRoot.querySelector('input[type="checkbox"][required]')?.checked)
	};
}
;
	/**
 * Калькулятор столешниц
 * Управление мастер-чекбоксами и связанными радио-кнопками
 */

let calculator1PricingRefreshLock = false;

// Функция для инициализации мастер-чекбоксов
function initMasterCheckRadios() {
    // Находим все мастер-чекбоксы
    const masterCheckboxes = document.querySelectorAll('.js--masterchekradios');

    masterCheckboxes.forEach(function(masterCheckbox) {
        if (masterCheckbox.dataset.masterCheckBound === '1') return;
        masterCheckbox.dataset.masterCheckBound = '1';

        // Находим соответствующую группу радио-кнопок
        // Они находятся в том же wrapper или следующем sibling
        const wrapper = masterCheckbox.closest('.js--masterchekradios-wrapper');
        let radioGroup = null;
        if (wrapper) {
            radioGroup = wrapper.querySelectorAll('.js--masterchekradios-radio');
        } else {
            // Альтернативный поиск: радио-кнопки в следующем элементе .js--droplist
            const nextList = masterCheckbox.closest('.js--droplist')?.nextElementSibling;
            if (nextList && nextList.classList.contains('js--droplist')) {
                radioGroup = nextList.querySelectorAll('.js--masterchekradios-radio');
            }
        }

        if (!radioGroup || radioGroup.length === 0) {
            console.warn('Не найдена группа радио-кнопок для мастер-чекбокса', masterCheckbox);
            return;
        }

        // Обработчик изменения состояния чекбокса
        function handleMasterChange() {
            const isChecked = masterCheckbox.checked;

            // Управление состоянием радио-кнопок
            radioGroup.forEach(function(radio) {
                radio.disabled = !isChecked;
            });

            // Управление видимостью списка радио-кнопок
            const listChecks = wrapper ? wrapper.querySelector('.js--droplist') : null;
            if (listChecks) {
                if (isChecked) {
                    listChecks.classList.add('active');
                } else {
                    listChecks.classList.remove('active');
                }
            }

            // Если чекбокс включен, активируем первую радио-кнопку
            if (isChecked) {
                const firstRadio = radioGroup[0];
                if (firstRadio && !firstRadio.checked) {
                    firstRadio.checked = true;
                    // Триггерим событие change для первой радио-кнопки
                    firstRadio.dispatchEvent(new Event('change', { bubbles: true }));
                }
            } else {
                // Если чекбокс выключен, снимаем выбор со всех радио-кнопок
                radioGroup.forEach(function(radio) {
                    radio.checked = false;
                });
            }

            // Вызов функции обновления изображений
            updateImageVisibility(masterCheckbox, isChecked);
        }

        // Инициализация начального состояния
        handleMasterChange();

        // Слушаем изменения
        masterCheckbox.addEventListener('change', handleMasterChange);

        // Также слушаем изменения радио-кнопок для обновления изображений
        radioGroup.forEach(function(radio) {
            radio.addEventListener('change', function() {
                updateImageForRadio(masterCheckbox, radio);
            });
        });
    });
}

// Функция обновления видимости изображения при изменении мастер-чекбокса
function updateImageVisibility(masterCheckbox, isChecked) {
    // Получаем data-атрибут, связывающий чекбокс с изображением или группой
    const imageId = masterCheckbox.dataset.imageId;
    if (!imageId) return;

    // Находим все изображения этой группы
    const groupImages = document.querySelectorAll(`.calculator-card__settings__img [data-group="${imageId}"]`);
    if (groupImages.length > 0) {
        // Это группа изображений (например, вырез под мойку)
        if (isChecked) {
            // При включении показываем изображение, соответствующее выбранной радио-кнопке
            // Сначала скрываем изображение по умолчанию, если есть
            const defaultImage = document.querySelector(`.calculator-card__settings__img [data-group="${imageId}"].default`);
            if (defaultImage) {
                defaultImage.classList.remove('active');
            }
            // Находим выбранную радио-кнопку в этой группе
            const wrapper = masterCheckbox.closest('.js--masterchekradios-wrapper');
            let selectedRadio = null;
            if (wrapper) {
                selectedRadio = wrapper.querySelector('.js--masterchekradios-radio:checked');
            }
            // Если есть выбранная радио-кнопка, показываем соответствующее изображение
            if (selectedRadio && selectedRadio.dataset.imageId) {
                const targetImage = document.querySelector(`.calculator-card__settings__img [data-image="${selectedRadio.dataset.imageId}"]`);
                if (targetImage) {
                    targetImage.classList.add('active');
                }
            }
        } else {
            // При выключении скрываем все изображения группы и показываем изображение по умолчанию
            groupImages.forEach(function(img) {
                img.classList.remove('active');
            });
            const defaultImage = document.querySelector(`.calculator-card__settings__img [data-group="${imageId}"].default`);
            if (defaultImage) {
                defaultImage.classList.add('active');
            }
        }
    } else {
        // Одиночное изображение (например, вырез под варочную панель)
        const imageElement = document.querySelector(`.calculator-card__settings__img [data-image="${imageId}"]`);
        if (imageElement) {
            if (isChecked) {
                imageElement.classList.add('active');
            } else {
                imageElement.classList.remove('active');
            }
        }
    }
}

// Функция обновления изображения при выборе радио-кнопки
function updateImageForRadio(masterCheckbox, radio) {
    // Получаем data-атрибут радио-кнопки для изображения
    const imageId = radio.dataset.imageId;
    if (!imageId) return;

    // Группа изображений определяется по data-image-id мастер-чекбокса
    const groupId = masterCheckbox.dataset.imageId;
    if (!groupId) return;

    // Скрываем все изображения в этой группе и показываем выбранное
    const groupImages = document.querySelectorAll(`.calculator-card__settings__img [data-group="${groupId}"]`);
    groupImages.forEach(function(img) {
        img.classList.remove('active');
    });

    const targetImage = document.querySelector(`.calculator-card__settings__img [data-image="${imageId}"]`);
    if (targetImage) {
        targetImage.classList.add('active');
    }
}

// Функция для инициализации простых чекбоксов (без радио-кнопок)
// Управляет видимостью изображений, связанных через data-image-id.
// Если указан атрибут data-default-image, то при выключении чекбокса
// будет показано изображение с соответствующим data-image.
function initSimpleCheckboxes() {
    const checkboxes = document.querySelectorAll('input[type="checkbox"][data-image-id]:not(.js--masterchekradios)');
    checkboxes.forEach(function(checkbox) {
        if (checkbox.dataset.simpleCheckBound === '1') return;
        checkbox.dataset.simpleCheckBound = '1';

        function updateImages() {
            const isChecked = checkbox.checked;
            const imageId = checkbox.dataset.imageId;
            if (!imageId) return;
            const imageElement = document.querySelector(`.calculator-card__settings__img [data-image="${imageId}"]`);
            const defaultImageId = checkbox.dataset.defaultImage;
            let defaultImageElement = null;
            if (defaultImageId) {
                defaultImageElement = document.querySelector(`.calculator-card__settings__img [data-image="${defaultImageId}"]`);
            }
            if (imageElement) {
                if (isChecked) {
                    imageElement.classList.add('active');
                } else {
                    imageElement.classList.remove('active');
                }
            }
            if (defaultImageElement) {
                if (isChecked) {
                    defaultImageElement.classList.remove('active');
                } else {
                    defaultImageElement.classList.add('active');
                }
            }
        }

        updateImages();
        checkbox.addEventListener('change', updateImages);
    });
}

// Функция для инициализации радио-кнопок выбора барной стойки
function initBarcounterRadios() {
    const calculator = document.querySelector('.js--calculator1');
    if (!calculator) return;
    if (calculator.dataset.barcounterRadiosBound === '1') return;
    calculator.dataset.barcounterRadiosBound = '1';

    const radios = calculator.querySelectorAll('input[name="form-barcounter"]');
    if (radios.length === 0) return;

    // Mapping data-атрибутов к целевым блокам
    const mapping = {
        'barcount-type__1': 'barcount__1',
        'sett-1': 'barcount__2',
        'sett-2': 'barcount__3'
    };

    function updateBarcountVisibility() {
        // Найти выбранную радио-кнопку
        const selectedRadio = calculator.querySelector('input[name="form-barcounter"]:checked');
        if (!selectedRadio) return;

        // Получить data-атрибут (data-barcount или data-sett)
        const dataAttr = selectedRadio.dataset.barcount || selectedRadio.dataset.sett;
        let targetBarcount = null;
        if (dataAttr && mapping[dataAttr]) {
            targetBarcount = mapping[dataAttr];
        }

        // Скрыть все блоки barcount
        const allBarcounts = calculator.querySelectorAll('.calculator-card__barcount');
        allBarcounts.forEach(barcount => {
            barcount.classList.remove('active');
            barcount.classList.add('hidden');
        });

        // Показать целевой блок, если есть
        if (targetBarcount) {
            const targetElement = calculator.querySelector(`.calculator-card__barcount[data-barcount="${targetBarcount}"]`);
            if (targetElement) {
                targetElement.classList.add('active');
                targetElement.classList.remove('hidden');
            }
        }
    }

    // Инициализация начального состояния
    updateBarcountVisibility();

    // Добавить обработчики изменений
    radios.forEach(radio => {
        radio.addEventListener('change', () => {
            updateBarcountVisibility();
            refreshCalculator1Pricing(calculator);
        });
    });
}

// Функция для инициализации радио-кнопок выбора кухонного острова
function initKitchenislandRadios() {
    const calculator = document.querySelector('.js--calculator1');
    if (!calculator) return;
    if (calculator.dataset.kitchenislandRadiosBound === '1') return;
    calculator.dataset.kitchenislandRadiosBound = '1';

    const radios = calculator.querySelectorAll('input[name="form-kitchenisland"]');
    if (radios.length === 0) return;

    // Mapping data-атрибутов к целевым блокам
    const mapping = {
        'kitchenisland-type__1': 'kitchenisland__1',
        'kitchenisland-type__2': 'kitchenisland__2',
        'kitchenisland-type__3': 'kitchenisland__3'
    };

    function updateKitchenislandVisibility() {
        // Найти выбранную радио-кнопку
        const selectedRadio = calculator.querySelector('input[name="form-kitchenisland"]:checked');
        if (!selectedRadio) return;

        // Получить data-атрибут
        const dataAttr = selectedRadio.dataset.kitchenisland;
        let targetKitchenisland = null;
        if (dataAttr && mapping[dataAttr]) {
            targetKitchenisland = mapping[dataAttr];
        }

        // Скрыть все блоки kitchenisland
        const allKitchenislands = calculator.querySelectorAll('.calculator-card__kitchenisland');
        allKitchenislands.forEach(kitchenisland => {
            kitchenisland.classList.remove('active');
            kitchenisland.classList.add('hidden');
        });

        // Показать целевой блок, если есть
        if (targetKitchenisland) {
            const targetElement = calculator.querySelector(`.calculator-card__kitchenisland[data-kitchenisland="${targetKitchenisland}"]`);
            if (targetElement) {
                targetElement.classList.add('active');
                targetElement.classList.remove('hidden');
            }
        }
    }

    // Инициализация начального состояния
    updateKitchenislandVisibility();

    // Добавить обработчики изменений
    radios.forEach(radio => {
        radio.addEventListener('change', () => {
            updateKitchenislandVisibility();
            refreshCalculator1Pricing(calculator);
        });
    });
}

// Инициализация при загрузке
initMasterCheckRadios();
initSimpleCheckboxes();
initBarcounterRadios();
initKitchenislandRadios();

function isCalculatorDynamicResultNode(node) {
    if (!node || node.nodeType !== 1) return false;

    return Boolean(
        node.closest?.('.calculator-card__rezult') ||
        node.classList?.contains('js-result-dimension-extra') ||
        node.classList?.contains('js-result-cuts-list') ||
        node.querySelector?.('.js-result-dimension-extra, .js-result-cuts-list')
    );
}

function shouldReinitCalculatorControls(mutations) {
    for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
            if (node.nodeType !== 1) continue;
            if (isCalculatorDynamicResultNode(node)) continue;

            if (
                node.matches?.('.js--masterchekradios, .js--masterchekradios-radio, .js--calculator1, .js--calculator2') ||
                node.querySelector?.('.js--masterchekradios, .js--masterchekradios-radio, .js--calculator1, .js--calculator2')
            ) {
                return true;
            }
        }
    }

    return false;
}

// Также инициализируем при динамических изменениях (если будут добавляться новые элементы)
const calculatorDomObserver = new MutationObserver(function(mutations) {
    if (!shouldReinitCalculatorControls(mutations)) return;

    initMasterCheckRadios();
    initSimpleCheckboxes();
    initBarcounterRadios();
    initKitchenislandRadios();
});

calculatorDomObserver.observe(document.body, { childList: true, subtree: true });

/**
 * Управление шагами калькулятора
 */
function initCalculatorSteps() {
    const calculator = document.querySelector('.js--calculator1');
    if (!calculator) return;
    if (calculator.dataset.stepsInitialized === 'true') return;
    calculator.dataset.stepsInitialized = 'true';

    const steps = calculator.querySelectorAll('.calculator-card__step');
    const form = calculator.querySelector('.js--calculator1-form');
    const nextBtn = calculator.querySelector('.js--calculator1-next');
    const prevBtn = calculator.querySelector('.js--calculator1-prev');
    const nextBtnText = calculator.querySelector('.js--calculator1-next-text');
    const progressLine = calculator.querySelector('.js--calculator1-progress');
    const counter = calculator.querySelector('.js--calculator1-counter');
    const footerEl = calculator.querySelector('.js--calculator-card-footer');
    const footerSummEl = calculator.querySelector('.js--calculator-card-rezult-summ');
    const formsendEl = calculator.querySelector('.js--calculator1-formsend');

    if (steps.length === 0) return;

    let currentStep = 0;
    let formSubmitted = false;
    const totalSteps = steps.length;

    function showCalculator1FormSent() {
        formSubmitted = true;

        const lastStep = steps[totalSteps - 1];
        lastStep.querySelector('.js--calculator1-contacts')?.classList.add('hidden');
        footerEl?.classList.add('hidden');
        formsendEl?.classList.remove('hidden');
    }

    function submitCalculator1() {
        const lastStep = steps[totalSteps - 1];
        const contactsRoot = lastStep.querySelector('.js--calculator1-contacts');
        const formError = lastStep.querySelector('.js--calculator1-form-error');

        hideFormError(formError);

        if (!validateContactFields(contactsRoot)) {
            showFormError(formError, 'Заполните контактные данные и подтвердите согласие на обработку персональных данных');
            contactsRoot?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }

        const payload = buildCalculator1Payload(calculator);
        console.log('[Calculator tabletop] submit payload:', payload);
        console.log('[Calculator tabletop] submit payload JSON:', JSON.stringify(payload, null, 2));

        showCalculator1FormSent();
    }

    // Функция обновления видимости шагов
    function updateSteps() {
        steps.forEach((step, index) => {
            if (index === currentStep) {
                step.classList.add('active');
                step.classList.remove('hidden');
            } else {
                step.classList.remove('active');
                step.classList.add('hidden');
            }
        });

        // Обновление прогресса
        if (progressLine) {
            const progressPercent = ((currentStep + 1) / totalSteps) * 100;
            progressLine.style.width = `${progressPercent}%`;
        }

        // Обновление счетчика
        if (counter) {
            counter.textContent = `${currentStep + 1}/${totalSteps}`;
        }

        // Управление видимостью кнопок
        if (prevBtn) {
            if (currentStep === 0) {
                prevBtn.disabled = true;
                prevBtn.classList.add('disabled');
            } else {
                prevBtn.disabled = false;
                prevBtn.classList.remove('disabled');
            }
        }

        // Управление видимостью кнопки "Далее" (скрываем на шаге 5)
        if (nextBtn) {
            if (currentStep === 4) { // Шаг 5 (индекс 4)
                nextBtn.classList.add('hidden');
                nextBtn.style.display = 'none';
            } else {
                nextBtn.classList.remove('hidden');
                nextBtn.style.display = '';
            }
        }

        // Обновление текста кнопки "Далее"
        if (nextBtnText) {
            if (currentStep === totalSteps - 1) {
                nextBtnText.textContent = 'отправить';
                // Можно изменить поведение на отправку формы
            } else {
                nextBtnText.textContent = 'Дальше';
            }
        }

        // Управление видимостью иконки стрелки у кнопки "Далее"
        if (nextBtn) {
            const nextBtnIcon = nextBtn.querySelector('i');
            if (nextBtnIcon) {
                if (currentStep === totalSteps - 1) {
                    nextBtnIcon.classList.add('hidden');
                } else {
                    nextBtnIcon.classList.remove('hidden');
                }
            }
        }

        // Текст кнопки "Назад" не меняется, но можно добавить логику при необходимости

        // После перехода на шаг 2, нужно показать соответствующий .calculator-card__tabletop
        if (currentStep === 1) {
            showTabletopForSelectedShape();
        }

        refreshCalculator1Pricing(calculator);

        if (footerSummEl && !formSubmitted) {
            footerSummEl.classList.toggle('hidden', currentStep === totalSteps - 1);
        }
    }

    // Функция показа соответствующего .calculator-card__tabletop по data-атрибуту
    function showTabletopForSelectedShape() {
        // Находим выбранную радио-кнопку формы столешницы
        const selectedShape = calculator.querySelector('input[name="form-tabletop"]:checked');
        if (!selectedShape) return;

        const tabletopId = selectedShape.dataset.tabletop; // tabletop__0, tabletop__1, tabletop__2
        const allTabletops = calculator.querySelectorAll('.calculator-card__tabletop');

        // Скрываем все tabletops
        allTabletops.forEach(tabletop => {
            tabletop.classList.remove('active');
            tabletop.classList.add('hidden');
        });

        // Показываем соответствующий tabletop
        const targetTabletop = calculator.querySelector(`.calculator-card__tabletop[data-tabletop="${tabletopId}"]`);
        if (targetTabletop) {
            targetTabletop.classList.add('active');
            targetTabletop.classList.remove('hidden');
        }
    }

    // Функция валидации шага столешницы (шаг 2)
    function validateTabletopStep() {
        // Находим активный блок tabletop
        const activeTabletop = calculator.querySelector('.calculator-card__tabletop.active');
        if (!activeTabletop) {
            console.warn('validateTabletopStep: активный блок столешницы не найден');
            return true; // если нет активного блока, пропускаем валидацию
        }

        // Находим все поля ввода типа text внутри активного блока
        const inputs = activeTabletop.querySelectorAll('input[type="text"]');
        let isValid = true;
        const emptyInputs = [];

        inputs.forEach(input => {
            const value = input.value.trim();
            if (value === '' || value === '0' || isNaN(parseFloat(value))) {
                isValid = false;
                emptyInputs.push(input);
                // Добавляем класс ошибки
                input.classList.add('error');
            } else {
                input.classList.remove('error');
            }
        });

        // Управление сообщением об ошибке
        let errorInfo = activeTabletop.querySelector('.form__info');
        if (!errorInfo) {
            // Создаем элемент сообщения об ошибке
            errorInfo = document.createElement('div');
            errorInfo.className = 'form__info';
            // Вставляем после .calculator-card__settings__content или в конец activeTabletop
            const content = activeTabletop.querySelector('.calculator-card__settings__content') || activeTabletop;
            content.appendChild(errorInfo);
        }

        if (!isValid) {
            // Показываем сообщение об ошибке
            errorInfo.textContent = 'Заполните все поля размеров столешницы';
            errorInfo.classList.add('error');
            errorInfo.style.display = 'block';
            console.warn('Не все поля столешницы заполнены');
            // Фокус на первое пустое поле
            if (emptyInputs.length > 0) {
                emptyInputs[0].focus();
            }
        } else {
            // Скрываем сообщение об ошибке
            errorInfo.classList.remove('error');
            errorInfo.textContent = '';
            errorInfo.style.display = 'none';
        }

        return isValid;
    }

    // Функция валидации шага барной стойки (шаг 3)
    function validateBarcounterStep() {
        // Находим выбранную радио-кнопку барной стойки
        const selectedRadio = calculator.querySelector('input[name="form-barcounter"]:checked');
        if (!selectedRadio) {
            console.warn('validateBarcounterStep: не выбрана барная стойка');
            return true; // если ничего не выбрано, пропускаем валидацию (может быть ошибка)
        }

        // Получаем текст выбранной опции
        const labelText = selectedRadio.closest('label')?.querySelector('span span')?.textContent?.trim() || '';
        // Если выбрана опция "Без барной стойки", валидация не требуется
        if (labelText.includes('Без барной стойки')) {
            return true;
        }

        // Определяем тип барной стойки по data-атрибуту
        const barType = selectedRadio.dataset.barcount || selectedRadio.dataset.sett;
        if (!barType) {
            console.warn('validateBarcounterStep: не удалось определить тип барной стойки');
            return true; // пропускаем валидацию
        }

        // Маппинг data-атрибутов радио-кнопок на data-barcount блоков
        const barTypeMapping = {
            'barcount-type__1': 'barcount__1',
            'sett-1': 'barcount__2',
            'sett-2': 'barcount__3'
        };
        const mappedType = barTypeMapping[barType] || barType;

        // Находим соответствующий блок с настройками
        const barSettings = calculator.querySelector(`.calculator-card__barcount[data-barcount*="${mappedType}"]`);
        if (!barSettings) {
            console.warn('validateBarcounterStep: блок настроек барной стойки не найден');
            return true; // пропускаем валидацию
        }

        // Находим все поля ввода типа text внутри этого блока
        const inputs = barSettings.querySelectorAll('input[type="text"]');
        let isValid = true;
        const emptyInputs = [];

        inputs.forEach(input => {
            const value = input.value.trim();
            if (value === '' || value === '0' || isNaN(parseFloat(value))) {
                isValid = false;
                emptyInputs.push(input);
                input.classList.add('error');
            } else {
                input.classList.remove('error');
            }
        });

        // Управление сообщением об ошибке
        let errorInfo = barSettings.querySelector('.form__info');
        if (!errorInfo) {
            // Создаем элемент сообщения об ошибке
            errorInfo = document.createElement('div');
            errorInfo.className = 'form__info';
            // Вставляем в конец barSettings
            barSettings.appendChild(errorInfo);
        }

        if (!isValid) {
            // Показываем сообщение об ошибке
            errorInfo.textContent = 'Заполните все поля размеров барной стойки';
            errorInfo.classList.add('error');
            errorInfo.style.display = 'block';
            console.warn('Не все поля барной стойки заполнены');
            // Фокус на первое пустое поле
            if (emptyInputs.length > 0) {
                emptyInputs[0].focus();
            }
        } else {
            // Скрываем сообщение об ошибке
            errorInfo.classList.remove('error');
            errorInfo.textContent = '';
            errorInfo.style.display = 'none';
        }

        return isValid;
    }

    // Функция валидации шага острова (шаг 4)
    function validateKitchenislandStep() {
        // Находим выбранную радио-кнопку острова
        const selectedRadio = calculator.querySelector('input[name="form-kitchenisland"]:checked');
        if (!selectedRadio) {
            console.warn('validateKitchenislandStep: не выбран остров');
            return true; // если ничего не выбрано, пропускаем валидацию
        }

        // Получаем текст выбранной опции
        const labelText = selectedRadio.closest('label')?.querySelector('span span')?.textContent?.trim() || '';
        // Если выбрана опция "Без острова", валидация не требуется
        if (labelText.includes('Без острова')) {
            return true;
        }

        // Определяем тип острова по data-атрибуту
        const islandType = selectedRadio.dataset.kitchenisland;
        if (!islandType) {
            console.warn('validateKitchenislandStep: не удалось определить тип острова');
            return true; // пропускаем валидацию
        }

        // Маппинг data-атрибутов радио-кнопок на data-kitchenisland блоков
        const islandTypeMapping = {
            'kitchenisland-type__1': 'kitchenisland__1',
            'kitchenisland-type__2': 'kitchenisland__2',
            'kitchenisland-type__3': 'kitchenisland__3'
        };
        const mappedType = islandTypeMapping[islandType] || islandType;

        // Находим соответствующий блок с настройками
        const islandSettings = calculator.querySelector(`.calculator-card__kitchenisland[data-kitchenisland*="${mappedType}"]`);
        if (!islandSettings) {
            console.warn('validateKitchenislandStep: блок настроек острова не найден');
            return true; // пропускаем валидацию
        }

        // Находим все поля ввода типа text внутри этого блока
        const inputs = islandSettings.querySelectorAll('input[type="text"]');
        let isValid = true;
        const emptyInputs = [];

        inputs.forEach(input => {
            const value = input.value.trim();
            if (value === '' || value === '0' || isNaN(parseFloat(value))) {
                isValid = false;
                emptyInputs.push(input);
                input.classList.add('error');
            } else {
                input.classList.remove('error');
            }
        });

        // Управление сообщением об ошибке
        let errorInfo = islandSettings.querySelector('.form__info');
        if (!errorInfo) {
            // Создаем элемент сообщения об ошибке
            errorInfo = document.createElement('div');
            errorInfo.className = 'form__info';
            // Вставляем в конец islandSettings
            islandSettings.appendChild(errorInfo);
        }

        if (!isValid) {
            // Показываем сообщение об ошибке
            errorInfo.textContent = 'Заполните все поля размеров острова';
            errorInfo.classList.add('error');
            errorInfo.style.display = 'block';
            console.warn('Не все поля острова заполнены');
            // Фокус на первое пустое поле
            if (emptyInputs.length > 0) {
                emptyInputs[0].focus();
            }
        } else {
            // Скрываем сообщение об ошибке
            errorInfo.classList.remove('error');
            errorInfo.textContent = '';
            errorInfo.style.display = 'none';
        }

        return isValid;
    }

    // Функция валидации текущего шага
    function validateCurrentStep() {
        switch (currentStep) {
            case 1: // Шаг 2 - столешница
                return validateTabletopStep();
            case 2: // Шаг 3 - барная стойка
                return validateBarcounterStep();
            case 3: // Шаг 4 - остров
                return validateKitchenislandStep();
            default:
                return true; // для остальных шагов валидация не требуется
        }
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', function(event) {
            event.preventDefault();

            if (currentStep >= totalSteps - 1) {
                submitCalculator1();
                return;
            }

            if (!validateCurrentStep()) return;

            currentStep++;
            updateSteps();
        });
    }

    if (form) {
        form.addEventListener('submit', function(event) {
            event.preventDefault();
            if (currentStep === totalSteps - 1) {
                submitCalculator1();
            }
        });
    }

    // Обработчик кнопки "Назад"
    if (prevBtn) {
        prevBtn.addEventListener('click', function() {
            if (formSubmitted || currentStep <= 0) return;

            currentStep--;
            updateSteps();
        });
    }

    // Обработчик кнопок "Выбрать" в карточках товара (шаг 5 -> шаг 6)
    const nextStep6Buttons = calculator.querySelectorAll('.js--calculator1-tonextstep6');
    nextStep6Buttons.forEach(button => {
        button.addEventListener('click', function() {
            if (currentStep !== 4) return;

            const card = button.closest('.js--calculator-stone-card');
            if (card) {
                const title = card.dataset.stoneTitle || card.querySelector('.listcard__title')?.textContent?.trim() || '';
                const price = parseFloat(card.dataset.stonePrice || '10000') || 10000;

                const titleEl = calculator.querySelector('.js--calculator1-stone-title');
                if (titleEl && title) {
                    titleEl.textContent = `вы выбрали ${title}`;
                }

                const priceEl = calculator.querySelector('.js--calculator1-stone-price');
                if (priceEl) {
                    priceEl.dataset.price = String(price);
                    priceEl.textContent = price.toLocaleString('ru-RU');
                }

                if (title) {
                    calculator.dataset.selectedStoneTitle = title;
                }
            }

            currentStep++;
            updateSteps();
        });
    });

    // Слушаем изменения выбора формы столешницы для обновления tabletops на шаге 2
    const shapeRadios = calculator.querySelectorAll('input[name="form-tabletop"]');
    shapeRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            if (currentStep === 1) {
                showTabletopForSelectedShape();
            }
        });
    });

    // Инициализация начального состояния
    updateSteps();
}

initCalculatorSteps();

/**
 * Сбор данных калькулятора
 */
function collectCalculatorData(calculator = document.querySelector('.js--calculator1')) {
    if (!calculator) return null;

    const data = {};

    // 1. Форма столешницы
    const shapeRadio = calculator.querySelector('input[name="form-tabletop"]:checked');
    if (shapeRadio) {
        data.shape = shapeRadio.closest('.calculator-card__radioblock')?.querySelector('.calculator-card__radioblock__text')?.textContent?.trim() || '';
        data.shapeValue = shapeRadio.dataset.tabletop || '';
    }

    // 2. Размеры столешницы (в зависимости от формы)
    data.dimensions = []; // массив объектов { label, value }
    let totalArea = 0;

    // Определяем имя поля ввода по выбранной форме
    let inputName = '';
    if (data.shapeValue === 'tabletop__0') inputName = 'tabletop';
    else if (data.shapeValue === 'tabletop__1') inputName = 'tabletop1';
    else if (data.shapeValue === 'tabletop__2') inputName = 'tabletop2';

    if (inputName) {
        // Находим активный блок tabletop
        const activeTabletop = calculator.querySelector(`.calculator-card__tabletop[data-tabletop="${data.shapeValue}"]`);
        if (activeTabletop) {
            // Собираем все поля ввода внутри этого блока
            const inputs = activeTabletop.querySelectorAll(`input[name^="${inputName}"][type="text"]`);
            inputs.forEach((input, index) => {
                const value = parseFloat(input.value) || 0;
                // Получаем label для этого поля
                const labelElement = input.closest('.form__line3')?.querySelector(`label[for="${input.id}"]`);
                let label = labelElement?.textContent?.replace('*', '').trim() || `Размер ${index + 1}`;
                data.dimensions.push({ label, value });

                // Для обратной совместимости сохраняем первые два размера как width и length
                if (index === 0) data.width = value;
                if (index === 1) data.length = value;
            });

            // Расчет площади (упрощенный: для прямой столешницы длина * ширина, для L-образной и U-образной нужно сложить площади прямоугольников)
            // Временное решение: используем первый и второй размеры как длина и ширина (как раньше)
            // TODO: точный расчет площади для сложных форм
            if (data.dimensions.length >= 2) {
                totalArea = (data.dimensions[0].value * data.dimensions[1].value) / 1000000;
            }
        }
    }

    // Если dimensions пуст, пытаемся получить старым способом (для совместимости)
    if (data.dimensions.length === 0) {
        const lengthInput = calculator.querySelector('input[name="tabletop"][type="text"]:first-of-type');
        const widthInput = calculator.querySelector('input[name="tabletop"][type="text"]:last-of-type');
        if (lengthInput) data.length = parseFloat(lengthInput.value) || 0;
        if (widthInput) data.width = parseFloat(widthInput.value) || 0;
        if (data.length && data.width) {
            totalArea = (data.length * data.width) / 1000000;
        }
    }

    data.area = totalArea;

    // 3. Вырезы и скосы (чекбоксы и радио с data-price)
    data.cuts = [];
    calculator.querySelectorAll('input[type="checkbox"][data-price]:checked').forEach(cb => {
        if (cb.classList.contains('js--masterchekradios')) return;

        const label = cb.closest('label');
        const text = label?.querySelector('span span')?.textContent || '';
        const price = parseFloat(cb.dataset.price) || 0;
        data.cuts.push({ text, price });
    });

    calculator.querySelectorAll('.js--masterchekradios-wrapper').forEach(wrapper => {
        const master = wrapper.querySelector('.js--masterchekradios');
        if (!master?.checked) return;

        const selectedRadio = wrapper.querySelector('.js--masterchekradios-radio:checked');
        if (!selectedRadio) return;

        const label = selectedRadio.closest('label');
        const text = label?.querySelector('span span')?.textContent || '';
        const price = parseFloat(selectedRadio.dataset.price) || 1500;
        data.cuts.push({ text, price });
    });

    // 4. Материал (камень) — шаг 6
    const stoneTitleEl = calculator.querySelector('.js--calculator1-stone-title');
    data.stone = stoneTitleEl?.textContent?.replace(/^вы выбрали\s*/i, '').trim()
        || calculator.dataset.selectedStoneTitle
        || 'Не выбрано';

    data.stonePrice = parseFloat(calculator.querySelector('.js--calculator1-stone-price')?.dataset.price || '10000') || 10000;

    // 5. Характеристики камня (свойства из списка на шаге 6)
    data.stoneProperties = {};
    const stoneStep = calculator.querySelector('.js--calculator1-stone-step');
    const propertyItems = stoneStep
        ? stoneStep.querySelectorAll('.content-columns__properties__list__item')
        : [];
    propertyItems.forEach(item => {
        const property = item.querySelector('span:first-child')?.textContent?.trim();
        const value = item.querySelector('span:last-child')?.textContent?.trim();
        if (property && value) {
            data.stoneProperties[property] = value;
        }
    });

    // 6. Толщина (слэб)
    const slabRadio = calculator.querySelector('input[name="slab"]:checked');
    if (slabRadio) {
        data.slab = slabRadio.closest('label')?.querySelector('span span')?.textContent?.trim() || '';
        data.slabPrice = parseFloat(slabRadio.dataset.price) || 0;
    }

    // 6. Фаска
    const chamferRadio = calculator.querySelector('input[name="form-chamfer"]:checked');
    if (chamferRadio) {
        data.chamfer = chamferRadio.closest('.calculator-card__radioblock')?.querySelector('.calculator-card__radioblock__text span')?.textContent?.trim() || '';
        // цена может быть в тексте, но проще из data-price
        data.chamferPrice = parseFloat(chamferRadio.dataset.price) || 0;
    }

    // 7. Барная стойка
    const barRadio = calculator.querySelector('input[name="form-barcounter"]:checked');
    data.barPrice = 0;
    if (barRadio) {
        data.bar = barRadio.closest('label')?.querySelector('span span')?.textContent?.trim() || '';

        if (data.bar && !data.bar.includes('Без барной стойки')) {
            data.barPrice = parseFloat(barRadio.dataset.price) || 0;

            const barType = barRadio.dataset.barcount || barRadio.dataset.sett;
            if (barType) {
                // Маппинг data-атрибутов радио-кнопок на data-barcount блоков
                const barTypeMapping = {
                    'barcount-type__1': 'barcount__1',
                    'sett-1': 'barcount__2',
                    'sett-2': 'barcount__3'
                };
                const mappedType = barTypeMapping[barType] || barType;
                // Находим соответствующий блок с настройками
                const barSettings = calculator.querySelector(`.calculator-card__barcount[data-barcount*="${mappedType}"]`);
                if (barSettings) {
                    const inputs = barSettings.querySelectorAll('input[name^="barcounter"][type="text"]');
                    if (inputs.length >= 1) data.barWidth = parseFloat(inputs[0].value) || 0;
                    if (inputs.length >= 2) data.barLength = parseFloat(inputs[1].value) || 0;
                    if (inputs.length >= 3) data.barHeight = parseFloat(inputs[2].value) || 0;
                }
            }
        }
    }

    // 8. Кухонный остров
    const islandRadio = calculator.querySelector('input[name="form-kitchenisland"]:checked');
    data.islandPrice = 0;
    if (islandRadio) {
        data.island = islandRadio.closest('label')?.querySelector('span span')?.textContent?.trim() || '';

        if (data.island && !data.island.includes('Без острова')) {
            data.islandPrice = parseFloat(islandRadio.dataset.price) || 0;

            const islandType = islandRadio.dataset.kitchenisland;
            if (islandType) {
                // Маппинг data-атрибутов радио-кнопок на data-kitchenisland блоков
                const islandTypeMapping = {
                    'kitchenisland-type__1': 'kitchenisland__1',
                    'kitchenisland-type__2': 'kitchenisland__2',
                    'kitchenisland-type__3': 'kitchenisland__3'
                };
                const mappedType = islandTypeMapping[islandType] || islandType;
                // Находим соответствующий блок с настройками
                const islandSettings = calculator.querySelector(`.calculator-card__kitchenisland[data-kitchenisland*="${mappedType}"]`);
                if (islandSettings) {
                    const inputs = islandSettings.querySelectorAll('input[name^="island"][type="text"]');
                    if (inputs.length >= 1) data.islandWidth = parseFloat(inputs[0].value) || 0;
                    if (inputs.length >= 2) data.islandLength = parseFloat(inputs[1].value) || 0;
                    if (inputs.length >= 3) data.islandHeight = parseFloat(inputs[2].value) || 0;
                }
            }
        }
    }

    // 9. Дополнительные опции (шаг 8)
    const dopOptions = calculator.querySelectorAll('input[name="dopoptions"]:checked');
    data.options = [];
    dopOptions.forEach(opt => {
        const label = opt.closest('label');
        const text = label?.querySelector('span span')?.textContent || '';
        const price = parseFloat(opt.dataset.price) || 0;
        data.options.push({ text, price });
    });

    // 10. Подклейка торца
    const gluingRadio = calculator.querySelector('input[name="dopoptions-gluing"]:checked');
    if (gluingRadio) {
        data.gluing = gluingRadio.closest('label')?.querySelector('span span')?.textContent?.trim() || '';
        data.gluingPrice = parseFloat(gluingRadio.dataset.price) || 0;
    }

    return data;
}

/**
 * Расчет общей суммы
 */
function calculateTotal(data) {
    let total = 0;

    // Базовая стоимость за материал (пока предположим 0)
    // Можно добавить логику расчета на основе площади и цены за м2
    const pricePerM2 = data.stonePrice || 10000;
    total += data.area * pricePerM2;

    // Добавки за толщину
    if (data.slabPrice) total += data.slabPrice;

    // Фаска
    if (data.chamferPrice) total += data.chamferPrice;

    // Вырезы и скосы
    if (data.cuts) {
        data.cuts.forEach(cut => total += cut.price);
    }

    // Барная стойка и остров
    if (data.barPrice) total += data.barPrice;
    if (data.islandPrice) total += data.islandPrice;

    // Дополнительные опции
    if (data.options) {
        data.options.forEach(opt => total += opt.price);
    }

    // Подклейка торца
    if (data.gluingPrice) total += data.gluingPrice;

    return Math.round(total);
}

function updateCalculator1FooterTotal(calculator) {
    const stepTotalEl = calculator?.querySelector('.js--result-steptotal');
    if (!stepTotalEl) return;

    const data = collectCalculatorData(calculator);
    if (!data) return;

    stepTotalEl.textContent = calculateTotal(data).toLocaleString('ru-RU');
}

function refreshCalculator1Pricing(calculator) {
    if (!calculator || calculator1PricingRefreshLock) return;

    calculator1PricingRefreshLock = true;
    try {
        updateCalculator1FooterTotal(calculator);

        const lastStep = calculator.querySelector('.calculator-card__step:last-child');
        if (lastStep?.classList.contains('active')) {
            updateResultStep(calculator);
        }
    } finally {
        calculator1PricingRefreshLock = false;
    }
}

function buildCalculator1Payload(calculator) {
    const data = collectCalculatorData(calculator);
    if (!data) return null;

    const total = calculateTotal(data);
    const lastStep = calculator.querySelector('.calculator-card__step:last-child');
    const contactsRoot = lastStep?.querySelector('.js--calculator1-contacts');

    return {
        calculatorType: 'tabletop',
        submittedAt: new Date().toISOString(),
        selection: {
            shape: data.shape,
            shapeValue: data.shapeValue,
            dimensions: data.dimensions,
            area: data.area,
            width: data.width,
            length: data.length,
            cuts: data.cuts,
            stone: data.stone,
            stoneProperties: data.stoneProperties,
            slab: data.slab,
            chamfer: data.chamfer,
            bar: data.bar,
            barWidth: data.barWidth,
            barLength: data.barLength,
            barHeight: data.barHeight,
            island: data.island,
            islandWidth: data.islandWidth,
            islandLength: data.islandLength,
            islandHeight: data.islandHeight,
            options: data.options,
            gluing: data.gluing || null
        },
        pricing: {
            total,
            area: data.area,
            stonePricePerM2: data.stonePrice || 10000,
            slabPrice: data.slabPrice || 0,
            chamferPrice: data.chamferPrice || 0,
            barPrice: data.barPrice || 0,
            islandPrice: data.islandPrice || 0,
            gluingPrice: data.gluingPrice || 0
        },
        contacts: collectContactFields(contactsRoot)
    };
}

/**
 * Обновление шага 9 (расчет стоимости) на основе собранных данных
 */
function updateResultStep(calculator = document.querySelector('.js--calculator1')) {
    if (!calculator) return;

    const steps = calculator.querySelectorAll('.calculator-card__step');
    if (steps.length === 0) return;

    const step9 = steps[steps.length - 1];
    if (!step9) return;

    const data = collectCalculatorData(calculator);
    if (!data) return;

    const total = calculateTotal(data);

    // Заполняем поля
    // Форма столешницы
    setTextContent(step9, '.js-result-shape', data.shape || 'Не выбрано');
    // Материал
    setTextContent(step9, '.js-result-stone', data.stone || 'Не выбрано');
    // Страна
    setTextContent(step9, '.js-result-country', data.stoneProperties?.['Страна'] || 'Не указано');
    // Цвет
    setTextContent(step9, '.js-result-color', data.stoneProperties?.['Цвет'] || 'Не указано');
    // Вид камня (используем свойство "Камень" или "Тип обработки")
    const stoneType = data.stoneProperties?.['Камень'] || data.stoneProperties?.['Тип обработки'] || 'Не указано';
    setTextContent(step9, '.js-result-stone-type', stoneType);
    // Толщина
    setTextContent(step9, '.js-result-slab', data.slab || 'Не выбрано');
    // Фаска
    setTextContent(step9, '.js-result-chamfer', data.chamfer || 'Не выбрано');
    // Площадь
    const areaText = data.area ? `${data.area.toFixed(2)} м<sup>2</sup>` : '0 м²';
    setHtmlContent(step9, '.js-result-area', areaText);
    // Ширина и длина (первые два размера для обратной совместимости)
    const widthText = data.width ? `${data.width} мм` : '0 мм';
    setTextContent(step9, '.js-result-width', widthText);
    const lengthText = data.length ? `${data.length} мм` : '0 мм';
    setTextContent(step9, '.js-result-length', lengthText);

    // Дополнительные размеры столешницы (если есть)
    if (data.dimensions && data.dimensions.length > 0) {
        // Находим список, в котором находятся ширина и длина
        const descriptionList = step9.querySelector('.calculator-card__rezult__item:first-child .calculator-card__rezult__list');
        if (descriptionList) {
            // Находим элемент "Длина", после которого будем вставлять дополнительные размеры
            const lengthItem = descriptionList.querySelector('li:has(.js-result-length)');
            if (lengthItem) {
                // Удаляем ранее добавленные дополнительные элементы (если были)
                const existingExtraItems = descriptionList.querySelectorAll('.js-result-dimension-extra');
                existingExtraItems.forEach(el => el.remove());

                // Добавляем каждый дополнительный размер, начиная с третьего (индекс 2)
                for (let i = 2; i < data.dimensions.length; i++) {
                    const dim = data.dimensions[i];
                    const li = document.createElement('li');
                    li.className = 'js-result-dimension-extra';
                    li.innerHTML = `<span class="label">${dim.label}</span><span class="text">${dim.value} мм</span>`;
                    // Вставляем после lengthItem
                    lengthItem.parentNode.insertBefore(li, lengthItem.nextSibling);
                }
            }
        }
    }

    // Обновление изображения столешницы в соответствии с выбранной формой
    const tabletopImage = step9.querySelector('.js-result-imgtabletop');
    if (tabletopImage) {
        // Находим выбранную радиокнопку формы столешницы
        const selectedShapeRadio = calculator.querySelector('input[name="form-tabletop"]:checked');
        if (selectedShapeRadio) {
            // Находим изображение внутри того же .calculator-card__radioblock__img
            const shapeImage = selectedShapeRadio.closest('.calculator-card__radioblock')?.querySelector('.calculator-card__radioblock__img img');
            if (shapeImage && shapeImage.src) {
                tabletopImage.src = shapeImage.src;
            }
			else {
                // Резервный вариант: формируем путь по data-tabletop
                const shapeValue = selectedShapeRadio.dataset.tabletop; // tabletop__0, tabletop__1, tabletop__2
                const num = shapeValue ? shapeValue.split('__')[1] : '0';
                // baseDir неизвестен, но можно взять из текущего изображения (уже содержит baseDir)
                const currentSrc = tabletopImage.src;
                const basePath = currentSrc.substring(0, currentSrc.lastIndexOf('/') + 1); // путь до папки calculator
                tabletopImage.src = `${basePath}img-calc-tabletop-${num}.jpg`;
            }
        }
    }

    // Барная стойка
    const barSection = step9.querySelector('.js-result-bar-section');
    if (barSection) {
        if (data.bar && data.bar.includes('Без барной стойки')) {
            barSection.style.display = 'none';
        } else {
            barSection.style.display = 'block';
            setTextContent(step9, '.js-result-bar-form', data.bar || 'Не выбрано');

            // Заполняем размеры барной стойки
            if (data.barWidth) {
                setTextContent(step9, '.js-result-bar-width', `${data.barWidth} мм`);
            } else {
                setTextContent(step9, '.js-result-bar-width', '0 мм');
            }

            if (data.barLength) {
                setTextContent(step9, '.js-result-bar-length', `${data.barLength} мм`);
            } else {
                setTextContent(step9, '.js-result-bar-length', '0 мм');
            }

            // Высота барной стойки
            if (data.barHeight) {
                setTextContent(step9, '.js-result-bar-height', `${data.barHeight} мм`);
            } else {
                setTextContent(step9, '.js-result-bar-height', '0 мм');
            }
        }
    }

    // Кухонный остров
    const islandSection = step9.querySelector('.js-result-island-section');
    if (islandSection) {
        if (data.island && data.island.includes('Без острова')) {
            islandSection.style.display = 'none';
        } else {
            islandSection.style.display = 'block';
            setTextContent(step9, '.js-result-island-form', data.island || 'Не выбрано');

            // Заполняем размеры острова
            if (data.islandWidth) {
                setTextContent(step9, '.js-result-island-width', `${data.islandWidth} мм`);
            } else {
                setTextContent(step9, '.js-result-island-width', '0 мм');
            }

            if (data.islandLength) {
                setTextContent(step9, '.js-result-island-length', `${data.islandLength} мм`);
            } else {
                setTextContent(step9, '.js-result-island-length', '0 мм');
            }

            if (data.islandHeight) {
                setTextContent(step9, '.js-result-island-height', `${data.islandHeight} мм`);
            } else {
                setTextContent(step9, '.js-result-island-height', '0 мм');
            }
        }
    }

    // Дополнительные опции
    // Определяем, какие опции выбраны
    const socketOption = data.options?.find(opt => opt.text.includes('розетку'));
    const faucetOption = data.options?.find(opt => opt.text.includes('смеситель') || opt.text.includes('дозатор'));
    const measureOption = data.options?.find(opt => opt.text.includes('Замер'));

    setTextContent(step9, '.js-result-option-socket', socketOption ? 'Да' : 'Нет');
    setTextContent(step9, '.js-result-option-faucet', faucetOption ? 'Да' : 'Нет');
    setTextContent(step9, '.js-result-option-measure', measureOption ? 'Да' : 'Нет');

    // Подклейка торца
    if (data.gluing) {
        if (data.gluing.includes('заподлицо')) {
            setTextContent(step9, '.js-result-option-glue-flush', 'Да');
            setTextContent(step9, '.js-result-option-glue-45', 'Нет');
        } else if (data.gluing.includes('45°')) {
            setTextContent(step9, '.js-result-option-glue-flush', 'Нет');
            setTextContent(step9, '.js-result-option-glue-45', 'Да');
        } else {
            setTextContent(step9, '.js-result-option-glue-flush', 'Нет');
            setTextContent(step9, '.js-result-option-glue-45', 'Нет');
        }
    } else {
        setTextContent(step9, '.js-result-option-glue-flush', 'Нет');
        setTextContent(step9, '.js-result-option-glue-45', 'Нет');
    }

    // Вырезы и скосы
    const cutsSection = step9.querySelector('.js-result-cuts-section');
    const cutsList = step9.querySelector('.js-result-cuts-list');
    if (cutsSection && cutsList) {
        if (data.cuts && data.cuts.length > 0) {
            cutsSection.style.display = 'block';
            cutsList.innerHTML = '';
            data.cuts.forEach(cut => {
                const li = document.createElement('li');
                li.innerHTML = `<span class="label">${cut.text}</span><span class="text">Да</span>`;
                cutsList.appendChild(li);
            });
        } else {
            cutsSection.style.display = 'none';
        }
    }

    const totalFormatted = total.toLocaleString('ru-RU');
    const totalElement = step9.querySelector('.js-result-total');
    if (totalElement) {
        totalElement.textContent = totalFormatted;
    }
}

/**
 * Вспомогательная функция для установки текстового содержимого
 */
function setTextContent(context, selector, text) {
    const element = context.querySelector(selector);
    if (element) element.textContent = text;
}

function setHtmlContent(context, selector, html) {
    const element = context.querySelector(selector);
    if (element) element.innerHTML = html;
}

/**
 * Инициализация обновления результатов при переходе на шаг 9
 */
function initResultUpdate() {
    const calculator = document.querySelector('.js--calculator1');
    if (!calculator) return;
    if (calculator.dataset.pricingBound === '1') return;
    calculator.dataset.pricingBound = '1';

    function handlePricingInput(event) {
        const target = event.target;
        if (!target.matches('input[type="checkbox"], input[type="radio"], input[type="text"], input[type="number"], select, textarea')) {
            return;
        }

        refreshCalculator1Pricing(calculator);
    }

    calculator.addEventListener('change', handlePricingInput);
    calculator.addEventListener('input', handlePricingInput);
}

initResultUpdate();
;
	/**
 * Калькулятор подоконников
 */

let calculator2PricingRefreshLock = false;

const WINDOWSILL_TYPE_LABELS = {
	'windowsill__0': 'Прямой',
	'windowsill__1': 'Угловой',
	'windowsill__2': 'Эркерный',
	'windowsill__3': 'Эркерный радиусный'
};

const WINDOWSILL_IMAGES = {
	'windowsill__0': 'img/calculator/windowsill/windowsill-0.jpg',
	'windowsill__1': 'img/calculator/windowsill/windowsill-1.jpg',
	'windowsill__2': 'img/calculator/windowsill/windowsill-2.jpg',
	'windowsill__3': 'img/calculator/windowsill/windowsill-3.jpg'
};

const STONE_CATALOG_STEP = 1;

function initWindowsillCalculator() {
	const calculator = document.querySelector('.js--calculator2');
	if (!calculator) return;

	initWindowsillFormToggle(calculator);
	initAddWindowsill(calculator);
	initWindowsillListActions(calculator);
	initCalculator2Steps(calculator);
	initCalculator2ResultUpdate(calculator);
}

/**
 * Переключение блоков параметров по типу подоконника
 */
function initWindowsillFormToggle(calculator) {
	const radioButtons = calculator.querySelectorAll('.js--windowsill-type-radio');
	const settingsBlocks = calculator.querySelectorAll('.js--windowsill-settings');

	if (!radioButtons.length || !settingsBlocks.length) return;

	function toggleSettings(selectedValue) {
		settingsBlocks.forEach(block => {
			const isActive = block.getAttribute('data-windowsill') === selectedValue;
			block.classList.toggle('active', isActive);
			block.classList.toggle('hidden', !isActive);
		});
	}

	calculator.addEventListener('change', event => {
		const target = event.target;
		if (!target.matches('.js--windowsill-type-radio') || !target.checked) return;
		const selectedValue = target.getAttribute('data-windowsill');
		if (selectedValue) toggleSettings(selectedValue);
		refreshCalculator2Pricing(calculator);
	});

	const checkedRadio = calculator.querySelector('.js--windowsill-type-radio:checked');
	if (checkedRadio) {
		toggleSettings(checkedRadio.getAttribute('data-windowsill'));
	}
}

/**
 * Добавление подоконника в список изделий
 */
function getWindowsillItemsContainer(calculator) {
	return calculator.querySelector('.js--windowsill-items');
}

function initAddWindowsill(calculator) {
	const emptyBlock = calculator.querySelector('.js--windowsill-empty');
	const itemsContainer = getWindowsillItemsContainer(calculator);
	const templatesRoot = calculator.querySelector('.js--windowsill-templates');
	const stepError = getWindowsillStep1Error(calculator);

	if (!emptyBlock || !itemsContainer || !templatesRoot) return;

	calculator.addEventListener('click', event => {
		const addBtn = event.target.closest('.js--windowsill-add-btn');
		if (!addBtn) return;

		event.preventDefault();
		event.stopPropagation();

		const settingsBlock = addBtn.closest('.js--windowsill-settings');
		if (!settingsBlock || !settingsBlock.classList.contains('active')) return;

		if (!validateWindowsillDimensions(settingsBlock, stepError)) return;

		const windowsillId = settingsBlock.getAttribute('data-windowsill');
		const dimensions = collectDimensionsFromBlock(settingsBlock);
		const typeLabel = getWindowsillTypeLabel(calculator, windowsillId);

		const card = addWindowsillCardFromTemplate(calculator, {
			windowsillId,
			typeLabel,
			dimensions
		});

		if (card) {
			initWindowsillInputCount(card.querySelector('.js--inputcount'));
			updateWindowsillListVisibility(calculator);
			refreshCalculator2Pricing(calculator);
		}
	});
}

function collectDimensionsFromBlock(settingsBlock) {
	return Array.from(settingsBlock.querySelectorAll('.js--windowsill-dimension')).map(input => {
		const labelEl = input.closest('.col-6')?.querySelector('label') ||
			settingsBlock.querySelector(`label[for="${input.id}"]`);
		const label = labelEl
			? labelEl.textContent.replace(/\s*\*\s*$/, '').trim()
			: '';
		return {
			label,
			value: parseFloat(input.value) || 0
		};
	});
}

const DIMENSION_LETTER_MAP = {
	A: 'А',
	B: 'В'
};

function formatDimensionLabel(label) {
	const match = label.match(/^([A-Fa-f])\b/);
	if (match) {
		const letter = match[1].toUpperCase();
		return `${DIMENSION_LETTER_MAP[letter] || letter}:`;
	}
	return `${label.replace(/\s*\([^)]*\)\s*/g, '').trim()}:`;
}

function getWindowsillTypeLabel(calculator, windowsillId) {
	const radio = calculator.querySelector(`.js--windowsill-type-radio[data-windowsill="${windowsillId}"]`);
	const text = radio?.closest('.calculator-card__radioblock')?.querySelector('.calculator-card__radioblock__text span')?.textContent?.trim();
	return text || WINDOWSILL_TYPE_LABELS[windowsillId] || 'Подоконник';
}

function addWindowsillCardFromTemplate(calculator, { windowsillId, typeLabel, dimensions }) {
	const templatesRoot = calculator.querySelector('.js--windowsill-templates');
	const itemsContainer = getWindowsillItemsContainer(calculator);
	const templateEl = templatesRoot?.querySelector(
		`template.js--windowsill-card-template[data-windowsill="${windowsillId}"]`
	);

	if (!templateEl || !itemsContainer || !templateEl.content.firstElementChild) {
		return null;
	}

	const card = templateEl.content.firstElementChild.cloneNode(true);
	card.dataset.windowsillId = windowsillId;
	card.dataset.windowsillItemId = `windowsill-item-${Date.now()}`;

	const nameEl = card.querySelector('.calc-windowsill__cardcart__name');
	if (nameEl) nameEl.textContent = typeLabel;

	const listEl = card.querySelector('.calc-windowsill__cardcart__list');
	if (listEl) {
		listEl.innerHTML = dimensions
			.map(dim => `<li>${formatDimensionLabel(dim.label)} ${formatDimensionValue(dim.value)}</li>`)
			.join('');
	}

	card.dataset.dimensions = JSON.stringify(dimensions);
	card.dataset.area = String(calculateWindowsillArea(windowsillId, dimensions));

	itemsContainer.appendChild(card);
	return card;
}

function initWindowsillInputCount(box) {
	if (!box || box.dataset.inputcountInit === 'true') return;

	const calculator = box.closest('.js--calculator2');
	const btnMinus = box.querySelector('.js--inputcount-minus');
	const btnPlus = box.querySelector('.js--inputcount-plus');
	const input = box.querySelector('.js--inputcount-input');

	if (!input || !btnMinus || !btnPlus) return;

	const getMin = () => (input.min !== '' ? Number(input.min) : 1);
	const getMax = () => (input.max !== '' ? Number(input.max) : 100);

	const clamp = value => {
		let next = Number.parseInt(String(value), 10);
		if (!Number.isFinite(next)) next = getMin();
		return Math.min(getMax(), Math.max(getMin(), next));
	};

	const updateButtons = () => {
		const value = clamp(input.value);
		input.value = value;
		btnMinus.disabled = value <= getMin();
		btnPlus.disabled = value >= getMax();
		if (calculator) refreshCalculator2Pricing(calculator);
	};

	btnMinus.addEventListener('click', () => {
		input.value = clamp(Number(input.value) - 1);
		updateButtons();
	});

	btnPlus.addEventListener('click', () => {
		input.value = clamp(Number(input.value) + 1);
		updateButtons();
	});

	input.addEventListener('change', updateButtons);
	updateButtons();
	box.dataset.inputcountInit = 'true';
}

function formatDimensionValue(value) {
	return `${Number(value).toLocaleString('ru-RU')} мм`;
}

function calculateWindowsillArea(windowsillId, dimensions) {
	const values = dimensions.map(d => d.value).filter(v => v > 0);
	if (!values.length) return 0;

	switch (windowsillId) {
		case 'windowsill__0':
			return values.length >= 2 ? (values[0] * values[1]) / 1e6 : 0;
		case 'windowsill__1':
			return values.length >= 4
				? ((values[0] * values[1]) + (values[2] * values[3])) / 1e6
				: 0;
		case 'windowsill__2':
			return values.length >= 6
				? ((values[0] * values[1]) + (values[2] * values[3]) + (values[4] * values[5])) / 1e6
				: 0;
		case 'windowsill__3':
			return values.length >= 4
				? ((values[0] * values[1]) + (values[2] * values[3])) / 1e6
				: 0;
		default:
			return values.length >= 2 ? (values[0] * values[1]) / 1e6 : 0;
	}
}

function validateWindowsillDimensions(settingsBlock, errorInfo) {
	const inputs = settingsBlock.querySelectorAll('.js--windowsill-dimension');
	let isValid = true;
	const emptyInputs = [];

	inputs.forEach(input => {
		const value = input.value.trim();
		if (value === '' || value === '0' || Number.isNaN(parseFloat(value))) {
			isValid = false;
			emptyInputs.push(input);
			input.classList.add('error');
		} else {
			input.classList.remove('error');
		}
	});

	if (errorInfo) {
		if (!isValid) {
			showFormError(errorInfo, 'Заполните все поля размеров подоконника');
			if (emptyInputs[0]) emptyInputs[0].focus();
		} else {
			hideFormError(errorInfo);
		}
	}

	return isValid;
}

function getWindowsillResultItems(calculator) {
	const itemsContainer = getWindowsillItemsContainer(calculator);
	return itemsContainer?.querySelectorAll('.js--windowsill-result-item') || [];
}

function getWindowsillStep1Content(calculator) {
	return calculator.querySelector('.js--calculator2-step')?.querySelector('.calculator-card__content');
}

function getWindowsillStep1Error(calculator) {
	const stepContent = getWindowsillStep1Content(calculator);
	return stepContent?.querySelector('.js--windowsill-step-error') || null;
}

function validateStep1List(calculator) {
	const cards = getWindowsillResultItems(calculator);
	const stepError = getWindowsillStep1Error(calculator);

	if (cards.length > 0) {
		hideFormError(stepError);
		return true;
	}

	showFormError(stepError, 'Добавьте хотя бы один подоконник в список изделий');
	return false;
}

function updateWindowsillListVisibility(calculator) {
	const emptyBlock = calculator.querySelector('.js--windowsill-empty');
	const resultList = calculator.querySelector('.js--windowsill-resultlist');
	if (!emptyBlock || !resultList) return;

	const hasItems = getWindowsillResultItems(calculator).length > 0;

	emptyBlock.classList.toggle('active', !hasItems);
	emptyBlock.classList.toggle('hidden', hasItems);
	resultList.classList.toggle('active', hasItems);
	resultList.classList.toggle('hidden', !hasItems);
}

function initWindowsillListActions(calculator) {
	calculator.addEventListener('click', event => {
		const removeBtn = event.target.closest('.js--windowsill-remove-btn');
		if (!removeBtn) return;

		const card = removeBtn.closest('.js--windowsill-result-item');
		if (card) card.remove();

		updateWindowsillListVisibility(calculator);
		refreshCalculator2Pricing(calculator);
	});
}

/**
 * Управление шагами калькулятора подоконников
 */
function initCalculator2Steps(calculator) {
	const steps = calculator.querySelectorAll('.js--calculator2-step');
	const nextBtn = calculator.querySelector('.js--calculator2-next');
	const prevBtn = calculator.querySelector('.js--calculator2-prev');
	const nextBtnText = calculator.querySelector('.js--calculator2-next-text');
	const progressLine = calculator.querySelector('.js--calculator2-progress');
	const counter = calculator.querySelector('.js--calculator2-counter');
	const footerEl = calculator.querySelector('.js--calculator-card-footer');
	const footerSummEl = calculator.querySelector('.js--calculator-card-rezult-summ');
	const formsendEl = calculator.querySelector('.js--calculator2-formsend');

	if (!steps.length) return;

	const form = calculator.querySelector('.js--calculator2-form');
	let currentStep = 0;
	let formSubmitted = false;
	const totalSteps = steps.length;
	let selectedStoneTitle = '';
	let selectedStonePrice = 10000;
	let selectedStoneImage = '';

	function showCalculator2FormSent() {
		formSubmitted = true;

		const lastStep = steps[totalSteps - 1];
		lastStep.querySelector('.js--calculator2-contacts')?.classList.add('hidden');
		footerEl?.classList.add('hidden');
		formsendEl?.classList.remove('hidden');
	}

	function submitCalculator2() {
		const lastStep = steps[totalSteps - 1];
		const contactsRoot = lastStep.querySelector('.js--calculator2-contacts');
		const formError = lastStep.querySelector('.js--calculator2-form-error');

		hideFormError(formError);

		if (!validateContactFields(contactsRoot)) {
			showFormError(formError, 'Заполните контактные данные и подтвердите согласие на обработку персональных данных');
			contactsRoot?.scrollIntoView({ behavior: 'smooth', block: 'center' });
			return;
		}

		const payload = buildWindowsillCalculatorPayload(calculator);
		console.log('[Calculator windowsill] submit payload:', payload);
		console.log('[Calculator windowsill] submit payload JSON:', JSON.stringify(payload, null, 2));

		showCalculator2FormSent();
	}

	function updateSteps() {
		steps.forEach((step, index) => {
			const isActive = index === currentStep;
			step.classList.toggle('active', isActive);
			step.classList.toggle('hidden', !isActive);
		});

		if (progressLine) {
			progressLine.style.width = `${((currentStep + 1) / totalSteps) * 100}%`;
		}

		if (counter) {
			counter.textContent = `${currentStep + 1}/${totalSteps}`;
		}

		if (prevBtn) {
			const isFirst = currentStep === 0;
			prevBtn.disabled = isFirst;
			prevBtn.classList.toggle('disabled', isFirst);
		}

		if (nextBtn) {
			const hideNext = currentStep === STONE_CATALOG_STEP;
			nextBtn.classList.toggle('hidden', hideNext);
			nextBtn.style.display = hideNext ? 'none' : '';
		}

		if (nextBtnText) {
			nextBtnText.textContent = currentStep === totalSteps - 1 ? 'отправить' : 'Дальше';
		}

		if (nextBtn) {
			const nextBtnIcon = nextBtn.querySelector('i');
			if (nextBtnIcon) {
				nextBtnIcon.classList.toggle('hidden', currentStep === totalSteps - 1);
			}
		}

		refreshCalculator2Pricing(calculator);

		if (footerSummEl && !formSubmitted) {
			footerSummEl.classList.toggle('hidden', currentStep === totalSteps - 1);
		}
	}

	function validateCurrentStep() {
		switch (currentStep) {
			case 0:
				return validateStep1List(calculator);
			default:
				return true;
		}
	}

	if (nextBtn) {
		nextBtn.addEventListener('click', event => {
			event.preventDefault();

			if (currentStep >= totalSteps - 1) {
				submitCalculator2();
				return;
			}

			if (!validateCurrentStep()) return;

			currentStep += 1;
			updateSteps();
		});
	}

	if (form) {
		form.addEventListener('submit', event => {
			event.preventDefault();
			if (currentStep === totalSteps - 1) {
				submitCalculator2();
			}
		});
	}

	if (prevBtn) {
		prevBtn.addEventListener('click', () => {
			if (formSubmitted || currentStep <= 0) return;

			currentStep -= 1;
			updateSteps();
		});
	}

	calculator.querySelectorAll('.js--calculator2-tonextstep3').forEach(button => {
		button.addEventListener('click', () => {
			if (currentStep !== STONE_CATALOG_STEP) return;

			const card = button.closest('.js--calculator-stone-card');
			if (card) {
				selectedStoneTitle = card.dataset.stoneTitle || card.querySelector('.listcard__title')?.textContent?.trim() || '';
				selectedStonePrice = parseFloat(card.dataset.stonePrice || '10000') || 10000;
				const img = card.querySelector('.listcard__picture img');
				selectedStoneImage = img?.getAttribute('src') || '';
				if (selectedStoneImage) {
					calculator.dataset.selectedStoneImage = selectedStoneImage;
				}

				const titleEl = calculator.querySelector('.js--calculator2-stone-title');
				if (titleEl && selectedStoneTitle) {
					titleEl.textContent = `вы выбрали ${selectedStoneTitle}`;
				}

				const priceBlock = calculator.querySelector('.js--calculator2-stone-price span');
				if (priceBlock) {
					priceBlock.dataset.price = String(selectedStonePrice);
					priceBlock.textContent = selectedStonePrice.toLocaleString('ru-RU');
				}
			}

			currentStep += 1;
			updateSteps();
		});
	});

	updateSteps();
}

function initCalculator2ResultUpdate(calculator) {
	if (calculator.dataset.pricingBound === '1') return;
	calculator.dataset.pricingBound = '1';

	function handlePricingInput(event) {
		const target = event.target;
		if (!target.matches('input[type="checkbox"], input[type="radio"], input[type="text"], input[type="number"], select, textarea')) {
			return;
		}

		refreshCalculator2Pricing(calculator);
	}

	calculator.addEventListener('change', handlePricingInput);
	calculator.addEventListener('input', handlePricingInput);
}

function collectWindowsillCalculatorData(calculator) {
	const data = {
		windowsills: [],
		options: [],
		totalArea: 0
	};

	getWindowsillResultItems(calculator).forEach(card => {
		const quantity = parseInt(card.querySelector('.js--inputcount-input')?.value, 10) || 1;
		const area = parseFloat(card.dataset.area) || 0;
		let dimensions = [];

		try {
			dimensions = JSON.parse(card.dataset.dimensions || '[]');
		} catch (e) {
			dimensions = [];
		}

		data.windowsills.push({
			name: card.querySelector('.calc-windowsill__cardcart__name')?.textContent?.trim() || '',
			windowsillId: card.dataset.windowsillId || '',
			dimensions,
			quantity,
			area,
			image: card.querySelector('.calc-windowsill__cardcart__img img')?.getAttribute('src') || ''
		});

		data.totalArea += area * quantity;
	});

	const stoneTitleEl = calculator.querySelector('.js--calculator2-stone-title');
	data.stone = stoneTitleEl?.textContent?.replace(/^вы выбрали\s*/i, '').trim() || 'Не выбрано';
	data.stonePrice = parseFloat(calculator.querySelector('.js--calculator2-stone-price span')?.dataset.price || '10000') || 10000;

	data.stoneProperties = {};
	calculator.querySelectorAll('.content-columns__properties__list__item').forEach(item => {
		const property = item.querySelector('span:first-child')?.textContent?.trim();
		const value = item.querySelector('span:last-child')?.textContent?.trim();
		if (property && value) data.stoneProperties[property] = value;
	});

	const slabRadio = calculator.querySelector('input[name="slab"]:checked');
	if (slabRadio) {
		data.slab = slabRadio.closest('label')?.querySelector('span span')?.textContent?.trim() || '';
		data.slabPrice = parseFloat(slabRadio.dataset.price) || 0;
	}

	const chamferRadio = calculator.querySelector('input[name="form-chamfer"]:checked');
	if (chamferRadio) {
		data.chamfer = chamferRadio.closest('.calculator-card__radioblock')?.querySelector('.calculator-card__radioblock__text span')?.textContent?.trim() || '';
		data.chamferPrice = parseFloat(chamferRadio.dataset.price) || 0;
	}

	calculator.querySelectorAll('input[name="dopoptions"]:checked').forEach(opt => {
		const label = opt.closest('label');
		data.options.push({
			text: label?.querySelector('span span')?.textContent?.trim() || '',
			price: parseFloat(opt.dataset.price) || 0
		});
	});

	const gluingRadio = calculator.querySelector('input[name="dopoptions-gluing"]:checked');
	if (gluingRadio) {
		data.gluing = gluingRadio.closest('label')?.querySelector('span span')?.textContent?.trim() || '';
		data.gluingPrice = parseFloat(gluingRadio.dataset.price) || 0;
	}

	return data;
}

function buildWindowsillCalculatorPayload(calculator) {
	const data = collectWindowsillCalculatorData(calculator);
	const total = calculateWindowsillTotal(data);
	const lastStep = calculator.querySelector('.js--calculator2-step:last-child');
	const contactsRoot = lastStep?.querySelector('.js--calculator2-contacts');

	return {
		calculatorType: 'windowsill',
		submittedAt: new Date().toISOString(),
		selection: {
			windowsills: data.windowsills,
			stone: data.stone,
			stoneProperties: data.stoneProperties,
			slab: data.slab,
			chamfer: data.chamfer,
			options: data.options,
			gluing: data.gluing || null
		},
		pricing: {
			total,
			totalArea: data.totalArea,
			stonePricePerM2: data.stonePrice,
			slabPrice: data.slabPrice || 0,
			chamferPrice: data.chamferPrice || 0,
			gluingPrice: data.gluingPrice || 0
		},
		contacts: collectContactFields(contactsRoot)
	};
}

function calculateWindowsillTotal(data) {
	let total = data.totalArea * (data.stonePrice || 0);

	if (data.slabPrice) total += data.slabPrice;
	if (data.chamferPrice) total += data.chamferPrice;

	data.options.forEach(opt => {
		total += opt.price;
	});

	if (data.gluingPrice) total += data.gluingPrice;

	return Math.round(total);
}

function updateCalculator2FooterTotal(calculator) {
	const stepTotalEl = calculator?.querySelector('.js--result-steptotal');
	if (!stepTotalEl) return;

	const data = collectWindowsillCalculatorData(calculator);
	stepTotalEl.textContent = calculateWindowsillTotal(data).toLocaleString('ru-RU');
}

function refreshCalculator2Pricing(calculator) {
	if (!calculator || calculator2PricingRefreshLock) return;

	calculator2PricingRefreshLock = true;
	try {
		updateCalculator2FooterTotal(calculator);

		const steps = calculator.querySelectorAll('.js--calculator2-step');
		const lastStep = steps[steps.length - 1];
		if (lastStep?.classList.contains('active')) {
			updateWindowsillResultStep(calculator, {
				selectedStoneTitle: calculator.querySelector('.js--calculator2-stone-title')?.textContent?.replace(/^вы выбрали\s*/i, '') || '',
				selectedStonePrice: parseFloat(calculator.querySelector('.js--calculator2-stone-price span')?.dataset.price || '10000') || 10000
			});
		}
	} finally {
		calculator2PricingRefreshLock = false;
	}
}

function updateWindowsillResultStep(calculator, { selectedStoneTitle, selectedStonePrice }) {
	const steps = calculator.querySelectorAll('.js--calculator2-step');
	const stepResult = steps[steps.length - 1];
	if (!stepResult) return;

	const data = collectWindowsillCalculatorData(calculator);
	if (selectedStoneTitle) data.stone = selectedStoneTitle;
	if (selectedStonePrice) data.stonePrice = selectedStonePrice;

	const total = calculateWindowsillTotal(data);
	const baseDir = getBaseDirFromCalculator(calculator);

	renderWindowsillsResultList(stepResult, data.windowsills, baseDir);

	setTextContent(stepResult, '.js-result-stone', data.stone || 'Не выбрано');
	setTextContent(stepResult, '.js-result-country', data.stoneProperties?.['Страна'] || 'Не указано');
	setTextContent(stepResult, '.js-result-color', data.stoneProperties?.['Цвет'] || 'Не указано');
	setTextContent(stepResult, '.js-result-stone-type', data.stoneProperties?.['Камень'] || data.stoneProperties?.['Тип обработки'] || 'Не указано');
	setTextContent(stepResult, '.js-result-slab', data.slab || 'Не выбрано');
	setTextContent(stepResult, '.js-result-chamfer', data.chamfer || 'Не выбрано');

	const earsOption = data.options.find(opt => opt.text.includes('Ушки'));
	const convectionOption = data.options.find(opt => opt.text.includes('конвекции'));
	const measureOption = data.options.find(opt => opt.text.includes('Замер'));

	setTextContent(stepResult, '.js-result-option-ears', earsOption ? 'Да' : 'Нет');
	setTextContent(stepResult, '.js-result-option-convection', convectionOption ? 'Да' : 'Нет');
	setTextContent(stepResult, '.js-result-option-measure', measureOption ? 'Да' : 'Нет');

	if (data.gluing) {
		if (data.gluing.includes('заподлицо')) {
			setTextContent(stepResult, '.js-result-option-glue-flush', 'Да');
			setTextContent(stepResult, '.js-result-option-glue-45', 'Нет');
		} else if (data.gluing.includes('45°')) {
			setTextContent(stepResult, '.js-result-option-glue-flush', 'Нет');
			setTextContent(stepResult, '.js-result-option-glue-45', 'Да');
		}
	} else {
		setTextContent(stepResult, '.js-result-option-glue-flush', 'Нет');
		setTextContent(stepResult, '.js-result-option-glue-45', 'Нет');
	}

	const totalFormatted = total.toLocaleString('ru-RU');
	const totalElement = stepResult.querySelector('.js-result-total');
	if (totalElement) {
		totalElement.textContent = totalFormatted;
	}

	const stoneImg = stepResult.querySelector('.js--result-stone-img');
	if (stoneImg) {
		const savedImg = calculator.dataset.selectedStoneImage;
		const firstCardImg = data.windowsills[0]?.image;
		if (savedImg) stoneImg.src = savedImg;
		else if (firstCardImg) stoneImg.src = firstCardImg;
	}
}

function renderWindowsillsResultList(stepResult, windowsills, baseDir) {
	const list = stepResult.querySelector('.js--result-windowsills-list');
	if (!list) return;

	list.innerHTML = '';

	windowsills.forEach(item => {
		const card = document.createElement('div');
		card.className = 'calculator-card__rezult__windowsills__card';

		const imageSrc = item.image || `${baseDir}${WINDOWSILL_IMAGES[item.windowsillId] || WINDOWSILL_IMAGES['windowsill__0']}`;
		const dimensionsHtml = item.dimensions
			.map(dim => `<li>${formatDimensionLabel(dim.label)} ${formatDimensionValue(dim.value)}</li>`)
			.join('');

		card.innerHTML = `
			<div class="calculator-card__rezult__windowsills__card__img">
				<img src="${imageSrc}" alt="${item.name}">
			</div>
			<div class="calculator-card__rezult__windowsills__card__body">
				<div class="calc-windowsill__cardcart__name">${item.name}</div>
				<ul class="calc-windowsill__cardcart__list">${dimensionsHtml}</ul>
				<div class="calc-windowsill__cardcart__count">Количество: ${item.quantity} шт.</div>
			</div>
		`;

		list.appendChild(card);
	});
}

function getBaseDirFromCalculator(calculator) {
	const img = calculator.querySelector('template.js--windowsill-card-template img');
	if (!img?.src) return '';
	const marker = 'img/calculator/windowsill/';
	const index = img.src.indexOf(marker);
	if (index === -1) return '';
	return img.src.slice(0, index);
}

function setTextContent(context, selector, text) {
	const element = context.querySelector(selector);
	if (element) element.textContent = text;
}

initWindowsillCalculator();
;
	function initTableOffersLines(root = document) {
	const scope = root?.querySelector ? root : document;

	scope.querySelectorAll('.js--table-offers-line').forEach((line) => {
		if (line.dataset.tableOffersBound) return;

		const trigger = line.querySelector('.js--table-offers-line-trigger');
		if (!trigger) return;

		line.dataset.tableOffersBound = '1';
		line.setAttribute('role', 'button');
		line.setAttribute('tabindex', '0');

		const cartBtn = line.querySelector('.table-offers__side__btn');

		cartBtn?.addEventListener('click', (event) => {
			event.stopPropagation();
		});

		line.addEventListener('click', (event) => {
			if (event.target.closest('.table-offers__side__btn')) return;
			trigger.click();
		});

		line.addEventListener('keydown', (event) => {
			if (event.key !== 'Enter' && event.key !== ' ') return;
			if (event.target.closest('.table-offers__side__btn')) return;

			event.preventDefault();
			trigger.click();
		});
	});
}

initTableOffersLines(document);
;
	// 404 page animations
const page404Element = document.querySelector('.page-404');
if (page404Element) {
	const eyesContainer = document.querySelector('.p404-eyes');
	const eyebrowsContainer = document.querySelector('.p404-eyebrows');
	const faceElement = document.querySelector('.p404-face');
	const imgBlock = document.querySelector('.page-404__img');
	const imgStone = document.querySelector('.page-404__img__stone');
	const svg = imgBlock?.querySelector('svg');

	if (eyesContainer && eyebrowsContainer && faceElement && imgBlock && imgStone && svg) {
		// Get eye circles
		const eyes = eyesContainer.querySelectorAll('circle');

		// Eye positions in SVG coordinates (initial positions)
		const eyePositions = [
			{ x: 183, y: 145, r: 7 }, // left eye
			{ x: 220, y: 145, r: 7 }, // right eye (adjusted for transform)
		];

		// Store original positions for reset
		const originalPositions = eyePositions.map(ep => ({ ...ep }));

		// Get viewBox dimensions
		const viewBox = svg.getAttribute('viewBox');
		const [, , vbWidth, vbHeight] = viewBox.split(' ').map(Number);

		// Eye following - track mouse movement
		const followEyesCursor = (e) => {
			const svgRect = svg.getBoundingClientRect();
			const mouseX = e.clientX - svgRect.left;
			const mouseY = e.clientY - svgRect.top;

			// Convert mouse position to SVG coordinates
			const svgX = (mouseX / svgRect.width) * vbWidth;
			const svgY = (mouseY / svgRect.height) * vbHeight;

			eyes.forEach((eye, index) => {
				const eyePos = eyePositions[index];
				const dx = svgX - eyePos.x;
				const dy = svgY - eyePos.y;
				const distance = Math.sqrt(dx * dx + dy * dy);
				const angle = Math.atan2(dy, dx);

				// Limit pupil movement within the eye - max 30% of eye radius
				const maxDist = eyePos.r * 0.5;
				const pupilX = eyePos.x + Math.cos(angle) * Math.min(distance * 0.15, maxDist);
				const pupilY = eyePos.y + Math.sin(angle) * Math.min(distance * 0.15, maxDist);

				gsap.to(eye, {
					attr: {
						cx: pupilX,
						cy: pupilY,
					},
					duration: 0.08,
				});
			});

			// Eyebrows movement - raise slightly on cursor movement
			if (eyebrowsContainer) {
				const eyebrows = eyebrowsContainer.querySelectorAll('path');
				eyebrows.forEach((brow) => {
					gsap.to(brow, {
						y: -5,
						duration: 0.15,
					});
				});
			}
		};

		// Reset eyebrows on mouse leave
		const resetEyebrows = () => {
			if (eyebrowsContainer) {
				const eyebrows = eyebrowsContainer.querySelectorAll('path');
				eyebrows.forEach((brow) => {
					gsap.to(brow, {
						y: 0,
						duration: 0.3,
						ease: 'power2.out',
					});
				});
			}
		};

		document.addEventListener('mousemove', followEyesCursor);
		document.addEventListener('mouseleave', resetEyebrows);

		// Floating animation for stone (img block with ::after) and face
		// Stone moves via its parent, face moves with it
		const floatingTimeline = gsap.timeline({ repeat: -1, yoyo: true });

		floatingTimeline.to(
			[imgStone, faceElement],
			{
				y: 5,
				duration: 2,
				ease: 'sine.inOut',
			},
			0 // Start at the same time
		);

		// Cleanup function
		window.page404Cleanup = () => {
			document.removeEventListener('mousemove', followEyesCursor);
			document.removeEventListener('mouseleave', resetEyebrows);
			floatingTimeline.kill();
		};
	}
}
;
	const sliderPartners = document.querySelector('.js--sl-partners');

function getCurrentTranslate(swiper) {
	const t = getComputedStyle(swiper.wrapperEl).transform;
	if (!t || t === 'none') return 0;
	const m = new DOMMatrixReadOnly(t);
	return swiper.isHorizontal() ? m.m41 : m.m42;
}

if (sliderPartners) {
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
			delay: 1,
			disableOnInteraction: false,
			waitForTransition: false,
			pauseOnMouseEnter: false,
		},

		breakpoints: {
			992: {
				spaceBetween: 30,
			},
		},
	})

	swiperPartners.init();

	sliderPartners.addEventListener('pointerenter', () => {
		const current = getCurrentTranslate(swiperPartners);

		swiperPartners.autoplay.stop();

		swiperPartners.setTransition(0);
		swiperPartners.setTranslate(current);

		swiperPartners.animating = false;
		if (typeof swiperPartners.transitionEnd === 'function') {
			swiperPartners.transitionEnd();
		}

		swiperPartners.updateProgress();
		swiperPartners.updateActiveIndex();
		swiperPartners.updateSlidesClasses();
	});

	sliderPartners.addEventListener('pointerleave', () => {
		swiperPartners.autoplay.start();
	});
};
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
;
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
;
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
;
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
;
	function initOffersSwiper(searchRoot) {
	const root = searchRoot && typeof searchRoot.querySelector === 'function' ? searchRoot : document;
	const sliderOffers = root.querySelector('.js--slider-offers');
	if (!sliderOffers || sliderOffers.swiper) return;

	const nextEl = sliderOffers.querySelector('.js--slider-offers-next');
	const prevEl = sliderOffers.querySelector('.js--slider-offers-prev');
	if (!nextEl || !prevEl) return;

	const swiper = new Swiper(sliderOffers, {
		loop: false,
		slidesPerView: 1,
		slidesPerGroup: 1,
		spaceBetween: 10,
		autoHeight: true,
		navigation: {
			nextEl,
			prevEl,
		},
	});

	requestAnimationFrame(() => {
		swiper.update();
	});
}

function destroyOffersSwiper() {
	const el = document.querySelector('.js--slider-offers');
	if (el?.swiper) {
		el.swiper.destroy(true, true);
	}
}

if (typeof Fancybox !== 'undefined') {
	Fancybox.bind('[data-fancybox-offers]', {
		showClass: 'fancy-modal-show',
		hideClass: 'fancy-modal-hide',
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
				destroyOffersSwiper();
			},
			done: (fancybox, slide) => {
				if (typeof window.attachFancyModalSwipeToSlide === 'function') {
					window.attachFancyModalSwipeToSlide(fancybox, slide);
				}
				const root = slide?.el || fancybox?.container;
				initOffersSwiper(root);
			},
		},
	});
}
;
	const cardThumbsEl = document.querySelector('.js--sl-card-thumbs');
const cardImagesEl = document.querySelector('.js--sl-card-images');

if (cardThumbsEl && cardImagesEl) {
	const cardImagesPaginationEl = cardImagesEl
		.closest('.card__media__body')
		?.querySelector('.js--sl-card-images-pagination');

	const swiperCardThumbs = new Swiper(cardThumbsEl, {
		loop: false,
		direction: 'vertical',
		slidesPerView: 3,
		spaceBetween: 10,
		autoHeight: true,
		watchSlidesProgress: true,
		watchOverflow: true,
		slideToClickedSlide: true,

        breakpoints: {
			768: {
				slidesPerView: 4,
			},
			991: {
				slidesPerView: 3,
			},
			1200: {
				slidesPerView: 4,
			},
		},
	});

	const swiperCardImages = new Swiper(cardImagesEl, {
		loop: false,
		slidesPerView: 1,
		speed: 400,
		effect: 'fade',
		fadeEffect: {
			crossFade: true,
		},
		thumbs: {
			swiper: swiperCardThumbs,
		},
		navigation: {
            disabledClass: 'disabled',
			nextEl: '.js--sl-card-thumbs-next',
			prevEl: '.js--sl-card-thumbs-prev',
		},
		pagination: cardImagesPaginationEl ? {
			el: cardImagesPaginationEl,
			clickable: true,
			bulletActiveClass: 'active',
		} : undefined,
	});

	let cardSliderResizeRaf = 0;
	const scheduleCardSliderUpdate = () => {
		cancelAnimationFrame(cardSliderResizeRaf);
		cardSliderResizeRaf = requestAnimationFrame(() => {
			swiperCardThumbs.update();
			swiperCardImages.update();
		});
	};

	window.addEventListener('resize', scheduleCardSliderUpdate);
	window.addEventListener('orientationchange', scheduleCardSliderUpdate);
}
;
	const CARDOFFER_IMAGES_SELECTOR = '.js--sl-cardofferimages';

function getCardofferImagesControls(sliderEl) {
	const host = sliderEl.closest('.cardoffer__img') || sliderEl.parentElement;

	return {
		prevEl: sliderEl.querySelector('.js--sl-cardofferimages-prev'),
		nextEl: sliderEl.querySelector('.js--sl-cardofferimages-next'),
		paginationEl: host?.querySelector('.js--sl-cardofferimages-pagination'),
	};
}

function toggleCardofferImagesControls(sliderEl, visible) {
	const { prevEl, nextEl, paginationEl } = getCardofferImagesControls(sliderEl);
	const nav = sliderEl.querySelector('.cardoffer__img__slider__nav');

	if (nav) nav.classList.toggle('d-none', !visible);
	if (paginationEl) paginationEl.classList.toggle('d-none', !visible);
	if (prevEl) prevEl.disabled = !visible;
	if (nextEl) nextEl.disabled = !visible;
}

function initCardofferImagesSwiper(sliderEl) {
	if (!sliderEl || sliderEl.swiper) return null;

	const slideCount = sliderEl.querySelectorAll('.swiper-slide').length;
	if (slideCount <= 1) {
		toggleCardofferImagesControls(sliderEl, false);
		return null;
	}

	const { prevEl, nextEl, paginationEl } = getCardofferImagesControls(sliderEl);
	if (!prevEl || !nextEl || !paginationEl) return null;

	toggleCardofferImagesControls(sliderEl, true);

	const swiper = new Swiper(sliderEl, {
		loop: false,
		slidesPerView: 1,
		speed: 400,
		effect: 'fade',
		fadeEffect: {
			crossFade: true,
		},
		watchOverflow: true,
		observer: true,
		observeParents: true,
		navigation: {
			prevEl,
			nextEl,
			disabledClass: 'disabled',
		},
		pagination: {
			el: paginationEl,
			clickable: true,
			bulletActiveClass: 'active',
		},
	});

	requestAnimationFrame(() => {
		swiper.update();
	});

	return swiper;
}

function initCardofferImagesSwipers(searchRoot) {
	const root = searchRoot?.querySelector ? searchRoot : document;
	root.querySelectorAll(CARDOFFER_IMAGES_SELECTOR).forEach(initCardofferImagesSwiper);
}

function updateCardofferImagesSwipers(searchRoot) {
	const root = searchRoot?.querySelector ? searchRoot : document;
	root.querySelectorAll(`${CARDOFFER_IMAGES_SELECTOR}.swiper-initialized`).forEach((sliderEl) => {
		sliderEl.swiper?.update();
	});
}

function scheduleCardofferImagesInit(searchRoot) {
	requestAnimationFrame(() => {
		const root = searchRoot?.querySelector ? searchRoot : document;
		initCardofferImagesSwipers(root);
		updateCardofferImagesSwipers(root);
	});
}

scheduleCardofferImagesInit(document);

window.addEventListener('resize', () => {
	updateCardofferImagesSwipers(document);
});

if ('MutationObserver' in window) {
	const cardofferImagesObserver = new MutationObserver((mutations) => {
		mutations.forEach((mutation) => {
			mutation.addedNodes.forEach((node) => {
				if (!(node instanceof Element)) return;

				if (node.matches?.(CARDOFFER_IMAGES_SELECTOR)) {
					scheduleCardofferImagesInit(node.parentElement || node);
					return;
				}

				if (node.querySelector?.(CARDOFFER_IMAGES_SELECTOR)) {
					scheduleCardofferImagesInit(node);
				}
			});
		});
	});

	cardofferImagesObserver.observe(document.body, { childList: true, subtree: true });
}
;
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
;
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
;
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
;

	/**
 * Пресеты карт Яндекса: центр, зум и маркеры.
 * Новая карта: добавьте объект в __YANDEX_MAP_PRESETS и разметку с class="js--map-yandex" data-yandex-preset="ключ".
 * Блок с class="js--map-pickup" всегда использует пресет pickup.
 */
(function () {
	window.__YANDEX_MAP_PRESETS = window.__YANDEX_MAP_PRESETS || {};

	// Координаты ориентировочные (х. Копанской) — замените на точку склада при необходимости
	window.__YANDEX_MAP_PRESETS.pickup = {
		location: {
			center: [38.79517, 45.16871],
			zoom: 15,
		},
		points: [
			{
				coordinates: [38.79517, 45.16871],
				title: 'Aningo',
			},
		],
	};
})();
;
	/**
 * Яндекс.Карты JS API v3: только при наличии .js--map-pickup или .js--map-yandex.
 * Ключ API: data-yandex-api-key на контейнере (или первый непустой среди карт на странице).
 */
(function () {
	var roots = document.querySelectorAll('.js--map-pickup, .js--map-yandex');
	if (!roots.length) return;

	var scriptPromise = null;

	function resolvePresetKey(el) {
		if (el.classList.contains('js--map-pickup')) return 'pickup';
		var key = el.getAttribute('data-yandex-preset');
		return key || null;
	}

	function loadYandexScript(apiKey) {
		if (window.ymaps3) return Promise.resolve(window.ymaps3);
		if (scriptPromise) return scriptPromise;
		scriptPromise = new Promise(function (resolve, reject) {
			var s = document.createElement('script');
			s.async = true;
			s.src =
				'https://api-maps.yandex.ru/v3/?apikey=' +
				encodeURIComponent(apiKey) +
				'&lang=ru_RU';
			s.onload = function () {
				resolve(window.ymaps3);
			};
			s.onerror = function () {
				scriptPromise = null;
				reject(new Error('Yandex Maps: не удалось загрузить скрипт API'));
			};
			document.head.appendChild(s);
		});
		return scriptPromise;
	}

	/**
	 * Редактор стилей Яндекса часто отдаёт JSON в укороченном виде (не как в JS API v3):
	 * — tags: "country" вместо { all: ["country"] }
	 * — tags: { any: "admin", none: [...] } вместо { any: ["admin"], none: [...] }
	 * Без этого блоки стилей API игнорирует.
	 */
	function normalizeTagList(val) {
		if (val == null) return undefined;
		if (Array.isArray(val)) return val;
		if (typeof val === 'string') return [val];
		return undefined;
	}

	function normalizeStyleRule(rule) {
		if (!rule || typeof rule !== 'object') return rule;
		var out = Object.assign({}, rule);
		var t = out.tags;
		if (typeof t === 'string') {
			out.tags = { all: [t] };
		} else if (t && typeof t === 'object' && !Array.isArray(t)) {
			var tags = Object.assign({}, t);
			['all', 'any', 'none'].forEach(function (k) {
				if (tags[k] == null) return;
				var n = normalizeTagList(tags[k]);
				if (n) tags[k] = n;
			});
			out.tags = tags;
		}
		return out;
	}

	function normalizeCustomization(data) {
		if (!data) return undefined;
		var rawStyle = null;
		if (Array.isArray(data)) rawStyle = data;
		else if (data.style && Array.isArray(data.style)) rawStyle = data.style;
		if (!rawStyle) return undefined;
		var style = rawStyle.map(normalizeStyleRule);
		var rest = {};
		if (!Array.isArray(data) && typeof data === 'object') {
			Object.keys(data).forEach(function (k) {
				if (k !== 'style') rest[k] = data[k];
			});
		}
		return Object.keys(rest).length ? Object.assign({ style: style }, rest) : { style: style };
	}

	/**
	 * В props слоя допускается Customization = массив правил ИЛИ { style, 'render-3d'? }.
	 * Если в JSON только список правил — отдаём массив (как в vanilla-примерах API).
	 */
	function customizationForSchemeLayer(normalized) {
		if (!normalized) return undefined;
		if (Array.isArray(normalized)) return normalized;
		if (normalized.style && Array.isArray(normalized.style)) {
			var keys = Object.keys(normalized);
			var extra = keys.filter(function (k) {
				return k !== 'style';
			});
			if (!extra.length) return normalized.style;
		}
		return normalized;
	}

	function fetchCustomization(url) {
		if (!url) return Promise.resolve(undefined);
		return fetch(url, { credentials: 'same-origin' })
			.then(function (r) {
				if (!r.ok) {
					console.warn('Yandex Maps: стиль не загружен', url, r.status);
					return undefined;
				}
				return r.json();
			})
			.then(normalizeCustomization)
			.catch(function (e) {
				console.warn('Yandex Maps: ошибка чтения JSON стиля', url, e);
				return undefined;
			});
	}

	function mergeLocation(presetLoc, dataCenter, dataZoom) {
		var loc = Object.assign({}, presetLoc || {});
		var cz = dataCenter ? String(dataCenter).trim() : '';
		if (cz) {
			var parts = cz.split(/[\s,;]+/).filter(Boolean);
			if (parts.length >= 2) {
				var lng = parseFloat(parts[0]);
				var lat = parseFloat(parts[1]);
				if (!isNaN(lng) && !isNaN(lat)) loc.center = [lng, lat];
			}
		}
		if (dataZoom != null && dataZoom !== '') {
			var z = parseFloat(dataZoom);
			if (!isNaN(z)) loc.zoom = z;
		}
		return loc;
	}

	function createPinElement(pinUrl, title) {
		var wrap = document.createElement('div');
		wrap.style.position = 'relative';
		wrap.style.transform = 'translate(-50%, -100%)';
		wrap.style.pointerEvents = 'none';
		var img = document.createElement('img');
		img.src = pinUrl;
		img.alt = title || '';
		img.width = 39;
		img.height = 52;
		img.style.display = 'block';
		img.draggable = false;
		wrap.appendChild(img);
		return wrap;
	}

	function pickApiKey(nodes) {
		for (var i = 0; i < nodes.length; i++) {
			var k = (nodes[i].getAttribute('data-yandex-api-key') || '').trim();
			if (k) return k;
		}
		return '';
	}

	var apiKey = pickApiKey(roots);
	if (!apiKey) {
		console.warn(
			'Yandex Maps: задайте data-yandex-api-key на контейнере карты (https://developer.tech.yandex.ru/)'
		);
		return;
	}

	var presets = window.__YANDEX_MAP_PRESETS || {};

	loadYandexScript(apiKey)
		.then(function (ymaps3) {
			return ymaps3.ready.then(function () {
				return ymaps3;
			});
		})
		.then(function (ymaps3) {
			var YMap = ymaps3.YMap;
			var YMapDefaultSchemeLayer = ymaps3.YMapDefaultSchemeLayer;
			var YMapDefaultFeaturesLayer = ymaps3.YMapDefaultFeaturesLayer;
			var YMapMarker = ymaps3.YMapMarker;

			var inits = [];

			roots.forEach(function (el) {
				var presetKey = resolvePresetKey(el);
				if (!presetKey) {
					console.warn(
						'Yandex Maps: для элемента с .js--map-yandex укажите data-yandex-preset="..."'
					);
					return;
				}
				var preset = presets[presetKey];
				if (!preset) {
					console.warn('Yandex Maps: нет пресета «' + presetKey + '» в __YANDEX_MAP_PRESETS');
					return;
				}

				var styleUrl =
					el.getAttribute('data-yandex-style') ||
					el.getAttribute('data-map-style-url') ||
					'';
				var pinUrl =
					el.getAttribute('data-yandex-pin') ||
					el.getAttribute('data-pin-src') ||
					'img/pin-map.svg';

				var loc = mergeLocation(
					preset.location,
					el.getAttribute('data-yandex-center'),
					el.getAttribute('data-yandex-zoom')
				);

				var points = preset.points && preset.points.length ? preset.points : [];

				inits.push(
					fetchCustomization(styleUrl).then(function (customization) {
						var layerCustomization = customizationForSchemeLayer(customization);
						var schemeOpts =
							layerCustomization !== undefined
								? { customization: layerCustomization }
								: {};
						var wantsVector =
							!!(styleUrl && String(styleUrl).trim()) || !!layerCustomization;
						var mapOpts = {
							location: loc,
							showScaleInCopyrights: true,
							theme: 'light',
						};
						// Кастомизация — векторные тайлы; при mode: 'auto' сначала рисуется растр без стиля
						if (wantsVector) {
							mapOpts.mode = 'vector';
						}
						var map = new YMap(el, mapOpts);
						var schemeLayer = new YMapDefaultSchemeLayer(schemeOpts);
						map.addChild(schemeLayer);
						map.addChild(new YMapDefaultFeaturesLayer({}));
						// Повторная установка кастомизации после attach (на случай гонки с mode)
						if (
							layerCustomization !== undefined &&
							schemeLayer &&
							typeof schemeLayer.update === 'function'
						) {
							queueMicrotask(function () {
								schemeLayer.update({
									customization: layerCustomization,
								});
							});
						}
						if (el.getAttribute('data-yandex-debug') === '1') {
							var blockCount = 0;
							if (Array.isArray(layerCustomization)) {
								blockCount = layerCustomization.length;
							} else if (
								layerCustomization &&
								layerCustomization.style &&
								Array.isArray(layerCustomization.style)
							) {
								blockCount = layerCustomization.style.length;
							}
							console.info('Yandex Maps debug', {
								styleUrl: styleUrl,
								mapMode: mapOpts.mode,
								customizationBlocks: blockCount,
							});
						}

						points.forEach(function (pt) {
							if (!pt || !pt.coordinates) return;
							var markerEl = createPinElement(pinUrl, pt.title);
							map.addChild(
								new YMapMarker(
									{
										coordinates: pt.coordinates,
									},
									markerEl
								)
							);
						});

						return map;
					})
				);
			});

			return Promise.all(inits);
		})
		.catch(function (e) {
			console.warn(e && e.message ? e.message : e);
		});
})();
;
})




