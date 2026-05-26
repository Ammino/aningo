/**
 * Общие утилиты валидации контактной формы в калькуляторах
 */

function getStepErrorElement(stepContent, className) {
	if (!stepContent) return null;

	let errorEl = stepContent.querySelector(`.${className}`);
	if (!errorEl) {
		errorEl = document.createElement('div');
		errorEl.className = `form__info ${className}`;
		errorEl.style.display = 'none';
		stepContent.appendChild(errorEl);
	}
	return errorEl;
}

function showFormError(errorEl, message) {
	if (!errorEl) return;
	errorEl.textContent = message;
	errorEl.classList.add('error');
	errorEl.style.display = 'block';
}

function hideFormError(errorEl) {
	if (!errorEl) return;
	errorEl.textContent = '';
	errorEl.classList.remove('error');
	errorEl.style.display = 'none';
}

function validateContactFields(contactsRoot) {
	if (!contactsRoot) return false;

	const fields = contactsRoot.querySelectorAll('input, textarea, select');
	let firstInvalid = null;
	let isValid = true;

	fields.forEach(field => {
		field.classList.remove('error');

		if (!field.checkValidity()) {
			isValid = false;
			field.classList.add('error');
			if (!firstInvalid) firstInvalid = field;
		}
	});

	if (firstInvalid) {
		firstInvalid.focus();
		if (typeof firstInvalid.reportValidity === 'function') {
			firstInvalid.reportValidity();
		}
	}

	return isValid;
}

function collectContactFields(contactsRoot) {
	if (!contactsRoot) {
		return { name: '', phone: '', consent: false };
	}

	return {
		name: contactsRoot.querySelector('[name="NAME"]')?.value.trim() || '',
		phone: contactsRoot.querySelector('[name="PHONE"]')?.value.trim() || '',
		consent: Boolean(contactsRoot.querySelector('input[type="checkbox"][required]')?.checked)
	};
}
