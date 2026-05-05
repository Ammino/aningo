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

