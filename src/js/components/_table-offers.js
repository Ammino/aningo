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
