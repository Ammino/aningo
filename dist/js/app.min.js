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

// fileinput
const fileInputs = document.querySelectorAll('.js--fileinput-input');

fileInputs.forEach((input) => {
    const fileInputWrap = input.closest('.form__fileipnut');
    const clearButton = fileInputWrap.querySelector('.js--fileinput-clear');
    const infoText = fileInputWrap.querySelector('.js--fileinput-info');

    input.addEventListener('change', (event) => {
        infoText.classList.remove('error');
        clearButton.classList.remove('active');

        const file = event.target.files[0];
        const validFormats = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/rtf'];

        if (file) {
            if (!validFormats.includes(file.type) || file.size > 5 * 1024 * 1024) {
                infoText.classList.add('error');
                infoText.textContent = "Неверный формат или размер документа: файл PDF, DOC, DOCX или RTF с максимальным размером - 5 мб";
                input.value = '';
                clearButton.classList.remove('active');
            } else {
                clearButton.classList.add('active');
                infoText.textContent = "Файл успешно загружен";
            }
        } else {
            clearButton.classList.remove('active');
        }
    });

    clearButton.addEventListener('click', (e) => {
		e.preventDefault()
        input.value = '';
        clearButton.classList.remove('active');
        infoText.classList.remove('error');
        infoText.textContent = "Формат PDF, DOC, DOCX или RTF с максимальным размером - 5 мб";
    });
});

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
};
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
		pagination: {
			el: '.js--sl-card-images-pagination',
			clickable: true,
			bulletActiveClass: 'active',
		},
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
})




