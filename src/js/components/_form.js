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
}