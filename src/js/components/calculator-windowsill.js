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
