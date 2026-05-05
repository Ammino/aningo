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
