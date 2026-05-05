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
// /tabs