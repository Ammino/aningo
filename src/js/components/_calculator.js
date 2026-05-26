/**
 * Калькулятор столешниц
 * Управление мастер-чекбоксами и связанными радио-кнопками
 */

// Функция для инициализации мастер-чекбоксов
function initMasterCheckRadios() {
    // Находим все мастер-чекбоксы
    const masterCheckboxes = document.querySelectorAll('.js--masterchekradios');

    masterCheckboxes.forEach(function(masterCheckbox) {
        // Находим соответствующую группу радио-кнопок
        // Они находятся в том же wrapper или следующем sibling
        const wrapper = masterCheckbox.closest('.js--masterchekradios-wrapper');
        let radioGroup = null;
        if (wrapper) {
            radioGroup = wrapper.querySelectorAll('.js--masterchekradios-radio');
        } else {
            // Альтернативный поиск: радио-кнопки в следующем элементе .js--droplist
            const nextList = masterCheckbox.closest('.js--droplist')?.nextElementSibling;
            if (nextList && nextList.classList.contains('js--droplist')) {
                radioGroup = nextList.querySelectorAll('.js--masterchekradios-radio');
            }
        }

        if (!radioGroup || radioGroup.length === 0) {
            console.warn('Не найдена группа радио-кнопок для мастер-чекбокса', masterCheckbox);
            return;
        }

        // Обработчик изменения состояния чекбокса
        function handleMasterChange() {
            const isChecked = masterCheckbox.checked;

            // Управление состоянием радио-кнопок
            radioGroup.forEach(function(radio) {
                radio.disabled = !isChecked;
            });

            // Управление видимостью списка радио-кнопок
            const listChecks = wrapper ? wrapper.querySelector('.js--droplist') : null;
            if (listChecks) {
                if (isChecked) {
                    listChecks.classList.add('active');
                } else {
                    listChecks.classList.remove('active');
                }
            }

            // Если чекбокс включен, активируем первую радио-кнопку
            if (isChecked) {
                const firstRadio = radioGroup[0];
                if (firstRadio && !firstRadio.checked) {
                    firstRadio.checked = true;
                    // Триггерим событие change для первой радио-кнопки
                    firstRadio.dispatchEvent(new Event('change', { bubbles: true }));
                }
            } else {
                // Если чекбокс выключен, снимаем выбор со всех радио-кнопок
                radioGroup.forEach(function(radio) {
                    radio.checked = false;
                });
            }

            // Вызов функции обновления изображений
            updateImageVisibility(masterCheckbox, isChecked);
        }

        // Инициализация начального состояния
        handleMasterChange();

        // Слушаем изменения
        masterCheckbox.addEventListener('change', handleMasterChange);

        // Также слушаем изменения радио-кнопок для обновления изображений
        radioGroup.forEach(function(radio) {
            radio.addEventListener('change', function() {
                updateImageForRadio(masterCheckbox, radio);
            });
        });
    });
}

// Функция обновления видимости изображения при изменении мастер-чекбокса
function updateImageVisibility(masterCheckbox, isChecked) {
    // Получаем data-атрибут, связывающий чекбокс с изображением или группой
    const imageId = masterCheckbox.dataset.imageId;
    if (!imageId) return;

    // Находим все изображения этой группы
    const groupImages = document.querySelectorAll(`.calculator-card__settings__img [data-group="${imageId}"]`);
    if (groupImages.length > 0) {
        // Это группа изображений (например, вырез под мойку)
        if (isChecked) {
            // При включении показываем изображение, соответствующее выбранной радио-кнопке
            // Сначала скрываем изображение по умолчанию, если есть
            const defaultImage = document.querySelector(`.calculator-card__settings__img [data-group="${imageId}"].default`);
            if (defaultImage) {
                defaultImage.classList.remove('active');
            }
            // Находим выбранную радио-кнопку в этой группе
            const wrapper = masterCheckbox.closest('.js--masterchekradios-wrapper');
            let selectedRadio = null;
            if (wrapper) {
                selectedRadio = wrapper.querySelector('.js--masterchekradios-radio:checked');
            }
            // Если есть выбранная радио-кнопка, показываем соответствующее изображение
            if (selectedRadio && selectedRadio.dataset.imageId) {
                const targetImage = document.querySelector(`.calculator-card__settings__img [data-image="${selectedRadio.dataset.imageId}"]`);
                if (targetImage) {
                    targetImage.classList.add('active');
                }
            }
        } else {
            // При выключении скрываем все изображения группы и показываем изображение по умолчанию
            groupImages.forEach(function(img) {
                img.classList.remove('active');
            });
            const defaultImage = document.querySelector(`.calculator-card__settings__img [data-group="${imageId}"].default`);
            if (defaultImage) {
                defaultImage.classList.add('active');
            }
        }
    } else {
        // Одиночное изображение (например, вырез под варочную панель)
        const imageElement = document.querySelector(`.calculator-card__settings__img [data-image="${imageId}"]`);
        if (imageElement) {
            if (isChecked) {
                imageElement.classList.add('active');
            } else {
                imageElement.classList.remove('active');
            }
        }
    }
}

// Функция обновления изображения при выборе радио-кнопки
function updateImageForRadio(masterCheckbox, radio) {
    // Получаем data-атрибут радио-кнопки для изображения
    const imageId = radio.dataset.imageId;
    if (!imageId) return;

    // Группа изображений определяется по data-image-id мастер-чекбокса
    const groupId = masterCheckbox.dataset.imageId;
    if (!groupId) return;

    // Скрываем все изображения в этой группе и показываем выбранное
    const groupImages = document.querySelectorAll(`.calculator-card__settings__img [data-group="${groupId}"]`);
    groupImages.forEach(function(img) {
        img.classList.remove('active');
    });

    const targetImage = document.querySelector(`.calculator-card__settings__img [data-image="${imageId}"]`);
    if (targetImage) {
        targetImage.classList.add('active');
    }
}

// Функция для инициализации простых чекбоксов (без радио-кнопок)
// Управляет видимостью изображений, связанных через data-image-id.
// Если указан атрибут data-default-image, то при выключении чекбокса
// будет показано изображение с соответствующим data-image.
function initSimpleCheckboxes() {
    // Находим все чекбоксы с data-image-id, но не являющиеся мастер-чекбоксами
    const checkboxes = document.querySelectorAll('input[type="checkbox"][data-image-id]:not(.js--masterchekradios)');
    checkboxes.forEach(function(checkbox) {
        function handleChange() {
            const isChecked = checkbox.checked;
            const imageId = checkbox.dataset.imageId;
            if (!imageId) return;
            const imageElement = document.querySelector(`.calculator-card__settings__img [data-image="${imageId}"]`);
            const defaultImageId = checkbox.dataset.defaultImage;
            let defaultImageElement = null;
            if (defaultImageId) {
                defaultImageElement = document.querySelector(`.calculator-card__settings__img [data-image="${defaultImageId}"]`);
            }
            // Управление основным изображением
            if (imageElement) {
                if (isChecked) {
                    imageElement.classList.add('active');
                } else {
                    imageElement.classList.remove('active');
                }
            }
            // Управление default-изображением
            if (defaultImageElement) {
                if (isChecked) {
                    defaultImageElement.classList.remove('active');
                } else {
                    defaultImageElement.classList.add('active');
                }
            }
        }
        // Инициализация начального состояния
        handleChange();
        checkbox.addEventListener('change', handleChange);
    });
}

// Функция для инициализации радио-кнопок выбора барной стойки
function initBarcounterRadios() {
    const calculator = document.querySelector('.js--calculator1');
    if (!calculator) return;

    const radios = calculator.querySelectorAll('input[name="form-barcounter"]');
    if (radios.length === 0) return;

    // Mapping data-атрибутов к целевым блокам
    const mapping = {
        'barcount-type__1': 'barcount__1',
        'sett-1': 'barcount__2',
        'sett-2': 'barcount__3'
    };

    function updateBarcountVisibility() {
        // Найти выбранную радио-кнопку
        const selectedRadio = calculator.querySelector('input[name="form-barcounter"]:checked');
        if (!selectedRadio) return;

        // Получить data-атрибут (data-barcount или data-sett)
        const dataAttr = selectedRadio.dataset.barcount || selectedRadio.dataset.sett;
        let targetBarcount = null;
        if (dataAttr && mapping[dataAttr]) {
            targetBarcount = mapping[dataAttr];
        }

        // Скрыть все блоки barcount
        const allBarcounts = calculator.querySelectorAll('.calculator-card__barcount');
        allBarcounts.forEach(barcount => {
            barcount.classList.remove('active');
            barcount.classList.add('hidden');
        });

        // Показать целевой блок, если есть
        if (targetBarcount) {
            const targetElement = calculator.querySelector(`.calculator-card__barcount[data-barcount="${targetBarcount}"]`);
            if (targetElement) {
                targetElement.classList.add('active');
                targetElement.classList.remove('hidden');
            }
        }
    }

    // Инициализация начального состояния
    updateBarcountVisibility();

    // Добавить обработчики изменений
    radios.forEach(radio => {
        radio.addEventListener('change', updateBarcountVisibility);
    });
}

// Функция для инициализации радио-кнопок выбора кухонного острова
function initKitchenislandRadios() {
    const calculator = document.querySelector('.js--calculator1');
    if (!calculator) return;

    const radios = calculator.querySelectorAll('input[name="form-kitchenisland"]');
    if (radios.length === 0) return;

    // Mapping data-атрибутов к целевым блокам
    const mapping = {
        'kitchenisland-type__1': 'kitchenisland__1',
        'kitchenisland-type__2': 'kitchenisland__2',
        'kitchenisland-type__3': 'kitchenisland__3'
    };

    function updateKitchenislandVisibility() {
        // Найти выбранную радио-кнопку
        const selectedRadio = calculator.querySelector('input[name="form-kitchenisland"]:checked');
        if (!selectedRadio) return;

        // Получить data-атрибут
        const dataAttr = selectedRadio.dataset.kitchenisland;
        let targetKitchenisland = null;
        if (dataAttr && mapping[dataAttr]) {
            targetKitchenisland = mapping[dataAttr];
        }

        // Скрыть все блоки kitchenisland
        const allKitchenislands = calculator.querySelectorAll('.calculator-card__kitchenisland');
        allKitchenislands.forEach(kitchenisland => {
            kitchenisland.classList.remove('active');
            kitchenisland.classList.add('hidden');
        });

        // Показать целевой блок, если есть
        if (targetKitchenisland) {
            const targetElement = calculator.querySelector(`.calculator-card__kitchenisland[data-kitchenisland="${targetKitchenisland}"]`);
            if (targetElement) {
                targetElement.classList.add('active');
                targetElement.classList.remove('hidden');
            }
        }
    }

    // Инициализация начального состояния
    updateKitchenislandVisibility();

    // Добавить обработчики изменений
    radios.forEach(radio => {
        radio.addEventListener('change', updateKitchenislandVisibility);
    });
}

// Инициализация при загрузке
initMasterCheckRadios();
initSimpleCheckboxes();
initBarcounterRadios();
initKitchenislandRadios();

// Также инициализируем при динамических изменениях (если будут добавляться новые элементы)
const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
        if (mutation.addedNodes.length) {
            initMasterCheckRadios();
            initSimpleCheckboxes();
            initBarcounterRadios();
            initKitchenislandRadios();
        }
    });
});

observer.observe(document.body, { childList: true, subtree: true });

/**
 * Управление шагами калькулятора
 */
function initCalculatorSteps() {
    const calculator = document.querySelector('.js--calculator1');
    if (!calculator) return;
    if (calculator.dataset.stepsInitialized === 'true') return;
    calculator.dataset.stepsInitialized = 'true';

    const steps = calculator.querySelectorAll('.calculator-card__step');
    const form = calculator.querySelector('.js--calculator1-form');
    const nextBtn = calculator.querySelector('.js--calculator1-next');
    const prevBtn = calculator.querySelector('.js--calculator1-prev');
    const nextBtnText = calculator.querySelector('.js--calculator1-next-text');
    const progressLine = calculator.querySelector('.js--calculator1-progress');
    const counter = calculator.querySelector('.js--calculator1-counter');

    if (steps.length === 0) return;

    let currentStep = 0;
    const totalSteps = steps.length;

    function submitCalculator1() {
        const lastStep = steps[totalSteps - 1];
        const contactsRoot = lastStep.querySelector('.js--calculator1-contacts');
        const formError = lastStep.querySelector('.js--calculator1-form-error');

        hideFormError(formError);

        if (!validateContactFields(contactsRoot)) {
            showFormError(formError, 'Заполните контактные данные и подтвердите согласие на обработку персональных данных');
            contactsRoot?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }

        const payload = buildCalculator1Payload(calculator);
        console.log('[Calculator tabletop] submit payload:', payload);
        console.log('[Calculator tabletop] submit payload JSON:', JSON.stringify(payload, null, 2));
    }

    // Функция обновления видимости шагов
    function updateSteps() {
        steps.forEach((step, index) => {
            if (index === currentStep) {
                step.classList.add('active');
                step.classList.remove('hidden');
            } else {
                step.classList.remove('active');
                step.classList.add('hidden');
            }
        });

        // Обновление прогресса
        if (progressLine) {
            const progressPercent = ((currentStep + 1) / totalSteps) * 100;
            progressLine.style.width = `${progressPercent}%`;
        }

        // Обновление счетчика
        if (counter) {
            counter.textContent = `${currentStep + 1}/${totalSteps}`;
        }

        // Управление видимостью кнопок
        if (prevBtn) {
            if (currentStep === 0) {
                prevBtn.disabled = true;
                prevBtn.classList.add('disabled');
            } else {
                prevBtn.disabled = false;
                prevBtn.classList.remove('disabled');
            }
        }

        // Управление видимостью кнопки "Далее" (скрываем на шаге 5)
        if (nextBtn) {
            if (currentStep === 4) { // Шаг 5 (индекс 4)
                nextBtn.classList.add('hidden');
                nextBtn.style.display = 'none';
            } else {
                nextBtn.classList.remove('hidden');
                nextBtn.style.display = '';
            }
        }

        // Обновление текста кнопки "Далее"
        if (nextBtnText) {
            if (currentStep === totalSteps - 1) {
                nextBtnText.textContent = 'отправить';
                // Можно изменить поведение на отправку формы
            } else {
                nextBtnText.textContent = 'Дальше';
            }
        }

        // Управление видимостью иконки стрелки у кнопки "Далее"
        if (nextBtn) {
            const nextBtnIcon = nextBtn.querySelector('i');
            if (nextBtnIcon) {
                if (currentStep === totalSteps - 1) {
                    nextBtnIcon.classList.add('hidden');
                } else {
                    nextBtnIcon.classList.remove('hidden');
                }
            }
        }

        // Текст кнопки "Назад" не меняется, но можно добавить логику при необходимости

        // После перехода на шаг 2, нужно показать соответствующий .calculator-card__tabletop
        if (currentStep === 1) {
            showTabletopForSelectedShape();
        }

        // После перехода на последний шаг (шаг 9), обновляем результаты
        if (currentStep === totalSteps - 1) {
            updateResultStep();
        }
    }

    // Функция показа соответствующего .calculator-card__tabletop по data-атрибуту
    function showTabletopForSelectedShape() {
        // Находим выбранную радио-кнопку формы столешницы
        const selectedShape = calculator.querySelector('input[name="form-tabletop"]:checked');
        if (!selectedShape) return;

        const tabletopId = selectedShape.dataset.tabletop; // tabletop__0, tabletop__1, tabletop__2
        const allTabletops = calculator.querySelectorAll('.calculator-card__tabletop');

        // Скрываем все tabletops
        allTabletops.forEach(tabletop => {
            tabletop.classList.remove('active');
            tabletop.classList.add('hidden');
        });

        // Показываем соответствующий tabletop
        const targetTabletop = calculator.querySelector(`.calculator-card__tabletop[data-tabletop="${tabletopId}"]`);
        if (targetTabletop) {
            targetTabletop.classList.add('active');
            targetTabletop.classList.remove('hidden');
        }
    }

    // Функция валидации шага столешницы (шаг 2)
    function validateTabletopStep() {
        // Находим активный блок tabletop
        const activeTabletop = calculator.querySelector('.calculator-card__tabletop.active');
        if (!activeTabletop) {
            console.warn('validateTabletopStep: активный блок столешницы не найден');
            return true; // если нет активного блока, пропускаем валидацию
        }

        // Находим все поля ввода типа text внутри активного блока
        const inputs = activeTabletop.querySelectorAll('input[type="text"]');
        let isValid = true;
        const emptyInputs = [];

        inputs.forEach(input => {
            const value = input.value.trim();
            if (value === '' || value === '0' || isNaN(parseFloat(value))) {
                isValid = false;
                emptyInputs.push(input);
                // Добавляем класс ошибки
                input.classList.add('error');
            } else {
                input.classList.remove('error');
            }
        });

        // Управление сообщением об ошибке
        let errorInfo = activeTabletop.querySelector('.form__info');
        if (!errorInfo) {
            // Создаем элемент сообщения об ошибке
            errorInfo = document.createElement('div');
            errorInfo.className = 'form__info';
            // Вставляем после .calculator-card__settings__content или в конец activeTabletop
            const content = activeTabletop.querySelector('.calculator-card__settings__content') || activeTabletop;
            content.appendChild(errorInfo);
        }

        if (!isValid) {
            // Показываем сообщение об ошибке
            errorInfo.textContent = 'Заполните все поля размеров столешницы';
            errorInfo.classList.add('error');
            errorInfo.style.display = 'block';
            console.warn('Не все поля столешницы заполнены');
            // Фокус на первое пустое поле
            if (emptyInputs.length > 0) {
                emptyInputs[0].focus();
            }
        } else {
            // Скрываем сообщение об ошибке
            errorInfo.classList.remove('error');
            errorInfo.textContent = '';
            errorInfo.style.display = 'none';
        }

        return isValid;
    }

    // Функция валидации шага барной стойки (шаг 3)
    function validateBarcounterStep() {
        // Находим выбранную радио-кнопку барной стойки
        const selectedRadio = calculator.querySelector('input[name="form-barcounter"]:checked');
        if (!selectedRadio) {
            console.warn('validateBarcounterStep: не выбрана барная стойка');
            return true; // если ничего не выбрано, пропускаем валидацию (может быть ошибка)
        }

        // Получаем текст выбранной опции
        const labelText = selectedRadio.closest('label')?.querySelector('span span')?.textContent?.trim() || '';
        // Если выбрана опция "Без барной стойки", валидация не требуется
        if (labelText.includes('Без барной стойки')) {
            return true;
        }

        // Определяем тип барной стойки по data-атрибуту
        const barType = selectedRadio.dataset.barcount || selectedRadio.dataset.sett;
        if (!barType) {
            console.warn('validateBarcounterStep: не удалось определить тип барной стойки');
            return true; // пропускаем валидацию
        }

        // Маппинг data-атрибутов радио-кнопок на data-barcount блоков
        const barTypeMapping = {
            'barcount-type__1': 'barcount__1',
            'sett-1': 'barcount__2',
            'sett-2': 'barcount__3'
        };
        const mappedType = barTypeMapping[barType] || barType;

        // Находим соответствующий блок с настройками
        const barSettings = calculator.querySelector(`.calculator-card__barcount[data-barcount*="${mappedType}"]`);
        if (!barSettings) {
            console.warn('validateBarcounterStep: блок настроек барной стойки не найден');
            return true; // пропускаем валидацию
        }

        // Находим все поля ввода типа text внутри этого блока
        const inputs = barSettings.querySelectorAll('input[type="text"]');
        let isValid = true;
        const emptyInputs = [];

        inputs.forEach(input => {
            const value = input.value.trim();
            if (value === '' || value === '0' || isNaN(parseFloat(value))) {
                isValid = false;
                emptyInputs.push(input);
                input.classList.add('error');
            } else {
                input.classList.remove('error');
            }
        });

        // Управление сообщением об ошибке
        let errorInfo = barSettings.querySelector('.form__info');
        if (!errorInfo) {
            // Создаем элемент сообщения об ошибке
            errorInfo = document.createElement('div');
            errorInfo.className = 'form__info';
            // Вставляем в конец barSettings
            barSettings.appendChild(errorInfo);
        }

        if (!isValid) {
            // Показываем сообщение об ошибке
            errorInfo.textContent = 'Заполните все поля размеров барной стойки';
            errorInfo.classList.add('error');
            errorInfo.style.display = 'block';
            console.warn('Не все поля барной стойки заполнены');
            // Фокус на первое пустое поле
            if (emptyInputs.length > 0) {
                emptyInputs[0].focus();
            }
        } else {
            // Скрываем сообщение об ошибке
            errorInfo.classList.remove('error');
            errorInfo.textContent = '';
            errorInfo.style.display = 'none';
        }

        return isValid;
    }

    // Функция валидации шага острова (шаг 4)
    function validateKitchenislandStep() {
        // Находим выбранную радио-кнопку острова
        const selectedRadio = calculator.querySelector('input[name="form-kitchenisland"]:checked');
        if (!selectedRadio) {
            console.warn('validateKitchenislandStep: не выбран остров');
            return true; // если ничего не выбрано, пропускаем валидацию
        }

        // Получаем текст выбранной опции
        const labelText = selectedRadio.closest('label')?.querySelector('span span')?.textContent?.trim() || '';
        // Если выбрана опция "Без острова", валидация не требуется
        if (labelText.includes('Без острова')) {
            return true;
        }

        // Определяем тип острова по data-атрибуту
        const islandType = selectedRadio.dataset.kitchenisland;
        if (!islandType) {
            console.warn('validateKitchenislandStep: не удалось определить тип острова');
            return true; // пропускаем валидацию
        }

        // Маппинг data-атрибутов радио-кнопок на data-kitchenisland блоков
        const islandTypeMapping = {
            'kitchenisland-type__1': 'kitchenisland__1',
            'kitchenisland-type__2': 'kitchenisland__2',
            'kitchenisland-type__3': 'kitchenisland__3'
        };
        const mappedType = islandTypeMapping[islandType] || islandType;

        // Находим соответствующий блок с настройками
        const islandSettings = calculator.querySelector(`.calculator-card__kitchenisland[data-kitchenisland*="${mappedType}"]`);
        if (!islandSettings) {
            console.warn('validateKitchenislandStep: блок настроек острова не найден');
            return true; // пропускаем валидацию
        }

        // Находим все поля ввода типа text внутри этого блока
        const inputs = islandSettings.querySelectorAll('input[type="text"]');
        let isValid = true;
        const emptyInputs = [];

        inputs.forEach(input => {
            const value = input.value.trim();
            if (value === '' || value === '0' || isNaN(parseFloat(value))) {
                isValid = false;
                emptyInputs.push(input);
                input.classList.add('error');
            } else {
                input.classList.remove('error');
            }
        });

        // Управление сообщением об ошибке
        let errorInfo = islandSettings.querySelector('.form__info');
        if (!errorInfo) {
            // Создаем элемент сообщения об ошибке
            errorInfo = document.createElement('div');
            errorInfo.className = 'form__info';
            // Вставляем в конец islandSettings
            islandSettings.appendChild(errorInfo);
        }

        if (!isValid) {
            // Показываем сообщение об ошибке
            errorInfo.textContent = 'Заполните все поля размеров острова';
            errorInfo.classList.add('error');
            errorInfo.style.display = 'block';
            console.warn('Не все поля острова заполнены');
            // Фокус на первое пустое поле
            if (emptyInputs.length > 0) {
                emptyInputs[0].focus();
            }
        } else {
            // Скрываем сообщение об ошибке
            errorInfo.classList.remove('error');
            errorInfo.textContent = '';
            errorInfo.style.display = 'none';
        }

        return isValid;
    }

    // Функция валидации текущего шага
    function validateCurrentStep() {
        switch (currentStep) {
            case 1: // Шаг 2 - столешница
                return validateTabletopStep();
            case 2: // Шаг 3 - барная стойка
                return validateBarcounterStep();
            case 3: // Шаг 4 - остров
                return validateKitchenislandStep();
            default:
                return true; // для остальных шагов валидация не требуется
        }
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', function(event) {
            event.preventDefault();

            if (currentStep >= totalSteps - 1) {
                submitCalculator1();
                return;
            }

            if (!validateCurrentStep()) return;

            currentStep++;
            updateSteps();
        });
    }

    if (form) {
        form.addEventListener('submit', function(event) {
            event.preventDefault();
            if (currentStep === totalSteps - 1) {
                submitCalculator1();
            }
        });
    }

    // Обработчик кнопки "Назад"
    if (prevBtn) {
        prevBtn.addEventListener('click', function() {
            if (currentStep > 0) {
                currentStep--;
                updateSteps();
            }
        });
    }

    // Обработчик кнопок "Выбрать" в карточках товара (шаг 5 -> шаг 6)
    const nextStep6Buttons = calculator.querySelectorAll('.js--calculator1-tonextstep6');
    nextStep6Buttons.forEach(button => {
        button.addEventListener('click', function() {
            if (currentStep !== 4) return;

            const card = button.closest('.js--calculator-stone-card');
            if (card) {
                const title = card.dataset.stoneTitle || card.querySelector('.listcard__title')?.textContent?.trim() || '';
                const price = parseFloat(card.dataset.stonePrice || '32000') || 32000;

                const titleEl = calculator.querySelector('.js--calculator1-stone-title');
                if (titleEl && title) {
                    titleEl.textContent = `вы выбрали ${title}`;
                }

                const priceEl = calculator.querySelector('.js--calculator1-stone-price');
                if (priceEl) {
                    priceEl.dataset.price = String(price);
                    priceEl.textContent = price.toLocaleString('ru-RU');
                }

                if (title) {
                    calculator.dataset.selectedStoneTitle = title;
                }
            }

            currentStep++;
            updateSteps();
        });
    });

    // Слушаем изменения выбора формы столешницы для обновления tabletops на шаге 2
    const shapeRadios = calculator.querySelectorAll('input[name="form-tabletop"]');
    shapeRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            if (currentStep === 1) {
                showTabletopForSelectedShape();
            }
        });
    });

    // Инициализация начального состояния
    updateSteps();
}

// Инициализация шагов калькулятора при загрузке
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCalculatorSteps);
} else {
    // DOM уже загружен
    initCalculatorSteps();
}

/**
 * Сбор данных калькулятора
 */
function collectCalculatorData() {
    const calculator = document.querySelector('.js--calculator1');
    if (!calculator) return null;

    const data = {};

    // 1. Форма столешницы
    const shapeRadio = calculator.querySelector('input[name="form-tabletop"]:checked');
    if (shapeRadio) {
        data.shape = shapeRadio.closest('.calculator-card__radioblock')?.querySelector('.calculator-card__radioblock__text')?.textContent?.trim() || '';
        data.shapeValue = shapeRadio.dataset.tabletop || '';
    }

    // 2. Размеры столешницы (в зависимости от формы)
    data.dimensions = []; // массив объектов { label, value }
    let totalArea = 0;

    // Определяем имя поля ввода по выбранной форме
    let inputName = '';
    if (data.shapeValue === 'tabletop__0') inputName = 'tabletop';
    else if (data.shapeValue === 'tabletop__1') inputName = 'tabletop1';
    else if (data.shapeValue === 'tabletop__2') inputName = 'tabletop2';

    if (inputName) {
        // Находим активный блок tabletop
        const activeTabletop = calculator.querySelector(`.calculator-card__tabletop[data-tabletop="${data.shapeValue}"]`);
        if (activeTabletop) {
            // Собираем все поля ввода внутри этого блока
            const inputs = activeTabletop.querySelectorAll(`input[name^="${inputName}"][type="text"]`);
            inputs.forEach((input, index) => {
                const value = parseFloat(input.value) || 0;
                // Получаем label для этого поля
                const labelElement = input.closest('.form__line3')?.querySelector(`label[for="${input.id}"]`);
                let label = labelElement?.textContent?.replace('*', '').trim() || `Размер ${index + 1}`;
                data.dimensions.push({ label, value });

                // Для обратной совместимости сохраняем первые два размера как width и length
                if (index === 0) data.width = value;
                if (index === 1) data.length = value;
            });

            // Расчет площади (упрощенный: для прямой столешницы длина * ширина, для L-образной и U-образной нужно сложить площади прямоугольников)
            // Временное решение: используем первый и второй размеры как длина и ширина (как раньше)
            // TODO: точный расчет площади для сложных форм
            if (data.dimensions.length >= 2) {
                totalArea = (data.dimensions[0].value * data.dimensions[1].value) / 1000000;
            }
        }
    }

    // Если dimensions пуст, пытаемся получить старым способом (для совместимости)
    if (data.dimensions.length === 0) {
        const lengthInput = calculator.querySelector('input[name="tabletop"][type="text"]:first-of-type');
        const widthInput = calculator.querySelector('input[name="tabletop"][type="text"]:last-of-type');
        if (lengthInput) data.length = parseFloat(lengthInput.value) || 0;
        if (widthInput) data.width = parseFloat(widthInput.value) || 0;
        if (data.length && data.width) {
            totalArea = (data.length * data.width) / 1000000;
        }
    }

    data.area = totalArea;

    // 3. Вырезы и скосы (чекбоксы с data-price)
    const checkboxes = calculator.querySelectorAll('input[type="checkbox"][data-price]');
    data.cuts = [];
    checkboxes.forEach(cb => {
        if (cb.checked) {
            const label = cb.closest('label');
            const text = label?.querySelector('span span')?.textContent || '';
            const price = parseFloat(cb.dataset.price) || 0;
            data.cuts.push({ text, price });
        }
    });

    // 4. Материал (камень) — шаг 6
    const stoneTitleEl = calculator.querySelector('.js--calculator1-stone-title');
    data.stone = stoneTitleEl?.textContent?.replace(/^вы выбрали\s*/i, '').trim()
        || calculator.dataset.selectedStoneTitle
        || 'Не выбрано';

    data.stonePrice = parseFloat(calculator.querySelector('.js--calculator1-stone-price')?.dataset.price || '32000') || 32000;

    // 5. Характеристики камня (свойства из списка на шаге 6)
    data.stoneProperties = {};
    const stoneStep = calculator.querySelector('.js--calculator1-stone-step');
    const propertyItems = stoneStep
        ? stoneStep.querySelectorAll('.content-columns__properties__list__item')
        : [];
    propertyItems.forEach(item => {
        const property = item.querySelector('span:first-child')?.textContent?.trim();
        const value = item.querySelector('span:last-child')?.textContent?.trim();
        if (property && value) {
            data.stoneProperties[property] = value;
        }
    });

    // 6. Толщина (слэб)
    const slabRadio = calculator.querySelector('input[name="slab"]:checked');
    if (slabRadio) {
        data.slab = slabRadio.closest('label')?.querySelector('span span')?.textContent?.trim() || '';
        data.slabPrice = parseFloat(slabRadio.dataset.price) || 0;
    }

    // 6. Фаска
    const chamferRadio = calculator.querySelector('input[name="form-chamfer"]:checked');
    if (chamferRadio) {
        data.chamfer = chamferRadio.closest('.calculator-card__radioblock')?.querySelector('.calculator-card__radioblock__text span')?.textContent?.trim() || '';
        // цена может быть в тексте, но проще из data-price
        data.chamferPrice = parseFloat(chamferRadio.dataset.price) || 0;
    }

    // 7. Барная стойка
    const barRadio = calculator.querySelector('input[name="form-barcounter"]:checked');
    if (barRadio) {
        data.bar = barRadio.closest('label')?.querySelector('span span')?.textContent?.trim() || '';

        if (data.bar && !data.bar.includes('Без барной стойки')) {
            const barType = barRadio.dataset.barcount || barRadio.dataset.sett;
            if (barType) {
                // Маппинг data-атрибутов радио-кнопок на data-barcount блоков
                const barTypeMapping = {
                    'barcount-type__1': 'barcount__1',
                    'sett-1': 'barcount__2',
                    'sett-2': 'barcount__3'
                };
                const mappedType = barTypeMapping[barType] || barType;
                // Находим соответствующий блок с настройками
                const barSettings = calculator.querySelector(`.calculator-card__barcount[data-barcount*="${mappedType}"]`);
                if (barSettings) {
                    const inputs = barSettings.querySelectorAll('input[name^="barcounter"][type="text"]');
                    if (inputs.length >= 1) data.barWidth = parseFloat(inputs[0].value) || 0;
                    if (inputs.length >= 2) data.barLength = parseFloat(inputs[1].value) || 0;
                    if (inputs.length >= 3) data.barHeight = parseFloat(inputs[2].value) || 0;
                }
            }
        }
    }

    // 8. Кухонный остров
    const islandRadio = calculator.querySelector('input[name="form-kitchenisland"]:checked');
    if (islandRadio) {
        data.island = islandRadio.closest('label')?.querySelector('span span')?.textContent?.trim() || '';

        if (data.island && !data.island.includes('Без острова')) {
            const islandType = islandRadio.dataset.kitchenisland;
            if (islandType) {
                // Маппинг data-атрибутов радио-кнопок на data-kitchenisland блоков
                const islandTypeMapping = {
                    'kitchenisland-type__1': 'kitchenisland__1',
                    'kitchenisland-type__2': 'kitchenisland__2',
                    'kitchenisland-type__3': 'kitchenisland__3'
                };
                const mappedType = islandTypeMapping[islandType] || islandType;
                // Находим соответствующий блок с настройками
                const islandSettings = calculator.querySelector(`.calculator-card__kitchenisland[data-kitchenisland*="${mappedType}"]`);
                if (islandSettings) {
                    const inputs = islandSettings.querySelectorAll('input[name^="island"][type="text"]');
                    if (inputs.length >= 1) data.islandWidth = parseFloat(inputs[0].value) || 0;
                    if (inputs.length >= 2) data.islandLength = parseFloat(inputs[1].value) || 0;
                    if (inputs.length >= 3) data.islandHeight = parseFloat(inputs[2].value) || 0;
                }
            }
        }
    }

    // 9. Дополнительные опции (шаг 8)
    const dopOptions = calculator.querySelectorAll('input[name="dopoptions"]:checked');
    data.options = [];
    dopOptions.forEach(opt => {
        const label = opt.closest('label');
        const text = label?.querySelector('span span')?.textContent || '';
        const price = parseFloat(opt.dataset.price) || 0;
        data.options.push({ text, price });
    });

    // 10. Подклейка торца
    const gluingRadio = calculator.querySelector('input[name="dopoptions-gluing"]:checked');
    if (gluingRadio) {
        data.gluing = gluingRadio.closest('label')?.querySelector('span span')?.textContent?.trim() || '';
        data.gluingPrice = parseFloat(gluingRadio.dataset.price) || 0;
    }

    return data;
}

/**
 * Расчет общей суммы
 */
function calculateTotal(data) {
    let total = 0;

    // Базовая стоимость за материал (пока предположим 0)
    // Можно добавить логику расчета на основе площади и цены за м2
    const pricePerM2 = data.stonePrice || 32000;
    total += data.area * pricePerM2;

    // Добавки за толщину
    if (data.slabPrice) total += data.slabPrice;

    // Фаска
    if (data.chamferPrice) total += data.chamferPrice;

    // Вырезы и скосы
    if (data.cuts) {
        data.cuts.forEach(cut => total += cut.price);
    }

    // Дополнительные опции
    if (data.options) {
        data.options.forEach(opt => total += opt.price);
    }

    // Подклейка торца
    if (data.gluingPrice) total += data.gluingPrice;

    return Math.round(total);
}

function buildCalculator1Payload(calculator) {
    const data = collectCalculatorData();
    if (!data) return null;

    const total = calculateTotal(data);
    const lastStep = calculator.querySelector('.calculator-card__step:last-child');
    const contactsRoot = lastStep?.querySelector('.js--calculator1-contacts');

    return {
        calculatorType: 'tabletop',
        submittedAt: new Date().toISOString(),
        selection: {
            shape: data.shape,
            shapeValue: data.shapeValue,
            dimensions: data.dimensions,
            area: data.area,
            width: data.width,
            length: data.length,
            cuts: data.cuts,
            stone: data.stone,
            stoneProperties: data.stoneProperties,
            slab: data.slab,
            chamfer: data.chamfer,
            bar: data.bar,
            barWidth: data.barWidth,
            barLength: data.barLength,
            barHeight: data.barHeight,
            island: data.island,
            islandWidth: data.islandWidth,
            islandLength: data.islandLength,
            islandHeight: data.islandHeight,
            options: data.options,
            gluing: data.gluing || null
        },
        pricing: {
            total,
            area: data.area,
            stonePricePerM2: data.stonePrice || 32000,
            slabPrice: data.slabPrice || 0,
            chamferPrice: data.chamferPrice || 0,
            gluingPrice: data.gluingPrice || 0
        },
        contacts: collectContactFields(contactsRoot)
    };
}

/**
 * Обновление шага 9 (расчет стоимости) на основе собранных данных
 */
function updateResultStep() {
    const calculator = document.querySelector('.js--calculator1');
    if (!calculator) return;

    const steps = calculator.querySelectorAll('.calculator-card__step');
    if (steps.length === 0) return;

    const step9 = steps[steps.length - 1];
    if (!step9) return;

    const data = collectCalculatorData();
    if (!data) return;

    const total = calculateTotal(data);

    // Заполняем поля
    // Форма столешницы
    setTextContent(step9, '.js-result-shape', data.shape || 'Не выбрано');
    // Материал
    setTextContent(step9, '.js-result-stone', data.stone || 'Не выбрано');
    // Страна
    setTextContent(step9, '.js-result-country', data.stoneProperties?.['Страна'] || 'Не указано');
    // Цвет
    setTextContent(step9, '.js-result-color', data.stoneProperties?.['Цвет'] || 'Не указано');
    // Вид камня (используем свойство "Камень" или "Тип обработки")
    const stoneType = data.stoneProperties?.['Камень'] || data.stoneProperties?.['Тип обработки'] || 'Не указано';
    setTextContent(step9, '.js-result-stone-type', stoneType);
    // Толщина
    setTextContent(step9, '.js-result-slab', data.slab || 'Не выбрано');
    // Фаска
    setTextContent(step9, '.js-result-chamfer', data.chamfer || 'Не выбрано');
    // Площадь
    const areaText = data.area ? `${data.area.toFixed(2)} м<sup>2</sup>` : '0 м²';
    setHtmlContent(step9, '.js-result-area', areaText);
    // Ширина и длина (первые два размера для обратной совместимости)
    const widthText = data.width ? `${data.width} мм` : '0 мм';
    setTextContent(step9, '.js-result-width', widthText);
    const lengthText = data.length ? `${data.length} мм` : '0 мм';
    setTextContent(step9, '.js-result-length', lengthText);

    // Дополнительные размеры столешницы (если есть)
    if (data.dimensions && data.dimensions.length > 0) {
        // Находим список, в котором находятся ширина и длина
        const descriptionList = step9.querySelector('.calculator-card__rezult__item:first-child .calculator-card__rezult__list');
        if (descriptionList) {
            // Находим элемент "Длина", после которого будем вставлять дополнительные размеры
            const lengthItem = descriptionList.querySelector('li:has(.js-result-length)');
            if (lengthItem) {
                // Удаляем ранее добавленные дополнительные элементы (если были)
                const existingExtraItems = descriptionList.querySelectorAll('.js-result-dimension-extra');
                existingExtraItems.forEach(el => el.remove());

                // Добавляем каждый дополнительный размер, начиная с третьего (индекс 2)
                for (let i = 2; i < data.dimensions.length; i++) {
                    const dim = data.dimensions[i];
                    const li = document.createElement('li');
                    li.className = 'js-result-dimension-extra';
                    li.innerHTML = `<span class="label">${dim.label}</span><span class="text">${dim.value} мм</span>`;
                    // Вставляем после lengthItem
                    lengthItem.parentNode.insertBefore(li, lengthItem.nextSibling);
                }
            }
        }
    }

    // Обновление изображения столешницы в соответствии с выбранной формой
    const tabletopImage = step9.querySelector('.js-result-imgtabletop');
    if (tabletopImage) {
        // Находим выбранную радиокнопку формы столешницы
        const selectedShapeRadio = calculator.querySelector('input[name="form-tabletop"]:checked');
        if (selectedShapeRadio) {
            // Находим изображение внутри того же .calculator-card__radioblock__img
            const shapeImage = selectedShapeRadio.closest('.calculator-card__radioblock')?.querySelector('.calculator-card__radioblock__img img');
            if (shapeImage && shapeImage.src) {
                tabletopImage.src = shapeImage.src;
            }
			else {
                // Резервный вариант: формируем путь по data-tabletop
                const shapeValue = selectedShapeRadio.dataset.tabletop; // tabletop__0, tabletop__1, tabletop__2
                const num = shapeValue ? shapeValue.split('__')[1] : '0';
                // baseDir неизвестен, но можно взять из текущего изображения (уже содержит baseDir)
                const currentSrc = tabletopImage.src;
                const basePath = currentSrc.substring(0, currentSrc.lastIndexOf('/') + 1); // путь до папки calculator
                tabletopImage.src = `${basePath}img-calc-tabletop-${num}.jpg`;
            }
        }
    }

    // Барная стойка
    const barSection = step9.querySelector('.js-result-bar-section');
    if (barSection) {
        if (data.bar && data.bar.includes('Без барной стойки')) {
            barSection.style.display = 'none';
        } else {
            barSection.style.display = 'block';
            setTextContent(step9, '.js-result-bar-form', data.bar || 'Не выбрано');

            // Заполняем размеры барной стойки
            if (data.barWidth) {
                setTextContent(step9, '.js-result-bar-width', `${data.barWidth} мм`);
            } else {
                setTextContent(step9, '.js-result-bar-width', '0 мм');
            }

            if (data.barLength) {
                setTextContent(step9, '.js-result-bar-length', `${data.barLength} мм`);
            } else {
                setTextContent(step9, '.js-result-bar-length', '0 мм');
            }

            // Высота барной стойки
            if (data.barHeight) {
                setTextContent(step9, '.js-result-bar-height', `${data.barHeight} мм`);
            } else {
                setTextContent(step9, '.js-result-bar-height', '0 мм');
            }
        }
    }

    // Кухонный остров
    const islandSection = step9.querySelector('.js-result-island-section');
    if (islandSection) {
        if (data.island && data.island.includes('Без острова')) {
            islandSection.style.display = 'none';
        } else {
            islandSection.style.display = 'block';
            setTextContent(step9, '.js-result-island-form', data.island || 'Не выбрано');

            // Заполняем размеры острова
            if (data.islandWidth) {
                setTextContent(step9, '.js-result-island-width', `${data.islandWidth} мм`);
            } else {
                setTextContent(step9, '.js-result-island-width', '0 мм');
            }

            if (data.islandLength) {
                setTextContent(step9, '.js-result-island-length', `${data.islandLength} мм`);
            } else {
                setTextContent(step9, '.js-result-island-length', '0 мм');
            }

            if (data.islandHeight) {
                setTextContent(step9, '.js-result-island-height', `${data.islandHeight} мм`);
            } else {
                setTextContent(step9, '.js-result-island-height', '0 мм');
            }
        }
    }

    // Дополнительные опции
    // Определяем, какие опции выбраны
    const socketOption = data.options?.find(opt => opt.text.includes('розетку'));
    const faucetOption = data.options?.find(opt => opt.text.includes('смеситель') || opt.text.includes('дозатор'));
    const measureOption = data.options?.find(opt => opt.text.includes('Замер'));

    setTextContent(step9, '.js-result-option-socket', socketOption ? 'Да' : 'Нет');
    setTextContent(step9, '.js-result-option-faucet', faucetOption ? 'Да' : 'Нет');
    setTextContent(step9, '.js-result-option-measure', measureOption ? 'Да' : 'Нет');

    // Подклейка торца
    if (data.gluing) {
        if (data.gluing.includes('заподлицо')) {
            setTextContent(step9, '.js-result-option-glue-flush', 'Да');
            setTextContent(step9, '.js-result-option-glue-45', 'Нет');
        } else if (data.gluing.includes('45°')) {
            setTextContent(step9, '.js-result-option-glue-flush', 'Нет');
            setTextContent(step9, '.js-result-option-glue-45', 'Да');
        } else {
            setTextContent(step9, '.js-result-option-glue-flush', 'Нет');
            setTextContent(step9, '.js-result-option-glue-45', 'Нет');
        }
    } else {
        setTextContent(step9, '.js-result-option-glue-flush', 'Нет');
        setTextContent(step9, '.js-result-option-glue-45', 'Нет');
    }

    // Вырезы и скосы
    const cutsSection = step9.querySelector('.js-result-cuts-section');
    const cutsList = step9.querySelector('.js-result-cuts-list');
    if (cutsSection && cutsList) {
        if (data.cuts && data.cuts.length > 0) {
            cutsSection.style.display = 'block';
            cutsList.innerHTML = '';
            data.cuts.forEach(cut => {
                const li = document.createElement('li');
                li.innerHTML = `<span class="label">${cut.text}</span><span class="text">Да</span>`;
                cutsList.appendChild(li);
            });
        } else {
            cutsSection.style.display = 'none';
        }
    }

    const totalElement = step9.querySelector('.js-result-total');
    if (totalElement) {
        totalElement.textContent = total.toLocaleString('ru-RU');
    }
}

/**
 * Вспомогательная функция для установки текстового содержимого
 */
function setTextContent(context, selector, text) {
    const element = context.querySelector(selector);
    if (element) element.textContent = text;
}

function setHtmlContent(context, selector, html) {
    const element = context.querySelector(selector);
    if (element) element.innerHTML = html;
}

/**
 * Инициализация обновления результатов при переходе на шаг 9
 */
function initResultUpdate() {
    const calculator = document.querySelector('.js--calculator1');
    if (!calculator) return;

    calculator.addEventListener('change', function() {
        const activeStep = calculator.querySelector('.calculator-card__step.active');
        const lastStep = calculator.querySelector('.calculator-card__step:last-child');
        if (activeStep && activeStep === lastStep) {
            updateResultStep();
        }
    });
}

// Инициализация после загрузки DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initResultUpdate);
} else {
    initResultUpdate();
}
