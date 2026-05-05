(() => {
	const FILTER_ROOT = '.js--sfilter';
	const LINK_SELECTOR = '.js--sfilter-link';
	const ITEM_SELECTOR = '.js--sfilter-item';
	const TRIGGER_SELECTOR = '.js--sfilter-trigger';
	const SLIDE_SELECTOR = '.js--sfilter-slide';
	const HIDDEN_CLASS = 'd-none';
	const COLLAPSED_CLASS = 'is-sfilter-collapsed';
	const TRANSITION_MS = 280;

	const root = document.querySelector(FILTER_ROOT);
	if (!root) return;

	const links = Array.from(root.querySelectorAll(LINK_SELECTOR));
	const items = Array.from(document.querySelectorAll(ITEM_SELECTOR));
	if (!links.length || !items.length) return;

	const parseValues = (el) => {
		const raw = el.getAttribute('data-svalue') || '';
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
		});
	});

	const activeLink = links.find((l) => l.classList.contains('active'));
	const initialKey = activeLink ? activeLink.getAttribute('data-sfilter') || 'all' : 'all';
	applyFilter(initialKey);
})();
