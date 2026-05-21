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
