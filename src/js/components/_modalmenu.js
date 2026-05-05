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
