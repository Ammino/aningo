// Форма с шагами
(function () {
  'use strict';

  function FormSteps(container) {
    this.container = container;
    this.form = container.querySelector('.js--formsteps form');
    this.steps = Array.from(container.querySelectorAll('.js--formsteps-step'));
    this.prevBtn = container.querySelector('.js--formsteps-prev');
    this.nextBtn = container.querySelector('.js--formsteps-next');
    this.counterEl = container.querySelector('.js--formsteps-counter');
    this.progressLine = container.querySelector('.js--formsteps-progress');
    this.currentIndex = 0;
    this.totalSteps = this.steps.length;

    this.init();
  }

  FormSteps.prototype.init = function () {
    if (this.totalSteps === 0) return;

    this.updateView();
    this.bindEvents();
    this.updateCounter();
    this.updateProgress();
  };

  FormSteps.prototype.bindEvents = function () {
    var self = this;

    if (this.prevBtn) {
      this.prevBtn.addEventListener('click', function (e) {
        e.preventDefault();
        self.prev();
      });
    }

    if (this.nextBtn) {
      this.nextBtn.addEventListener('click', function (e) {
        e.preventDefault();
        self.next();
      });
    }
  };

  FormSteps.prototype.prev = function () {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.updateView();
      this.updateCounter();
      this.updateProgress();
    }
  };

  FormSteps.prototype.next = function () {
    if (this.currentIndex < this.totalSteps - 1) {
      this.currentIndex++;
      this.updateView();
      this.updateCounter();
      this.updateProgress();
    } else {
      // Если это последний шаг, можно отправить форму
      this.submitForm();
    }
  };

  FormSteps.prototype.updateView = function () {
    var self = this;

    this.steps.forEach(function (slide, index) {
      if (index === self.currentIndex) {
        slide.classList.add('active');
      } else {
        slide.classList.remove('active');
      }
    });

    // Обновляем состояние кнопок
    if (this.prevBtn) {
      if (this.currentIndex === 0) {
        this.prevBtn.disabled = true;
      } else {
        this.prevBtn.disabled = false;
      }
    }

    if (this.nextBtn) {
      var nextText = this.currentIndex === this.totalSteps - 1 ? 'Отправить' : 'Дальше';
      var nextSpan = this.nextBtn.querySelector('span');
      if (nextSpan) nextSpan.textContent = nextText;
    }
  };

  FormSteps.prototype.updateCounter = function () {
    if (this.counterEl) {
      this.counterEl.textContent = (this.currentIndex + 1) + '/' + this.totalSteps;
    }
  };

  FormSteps.prototype.updateProgress = function () {
    if (this.progressLine && this.totalSteps > 0) {
      var percent = ((this.currentIndex + 1) / this.totalSteps) * 100;
      this.progressLine.style.width = percent + '%';
    }
  };

  FormSteps.prototype.submitForm = function () {
    if (this.form) {
      // Здесь можно добавить валидацию перед отправкой
      console.log('Форма отправлена');
      this.form.submit();
    }
  };

  // Инициализация при загрузке DOM
  function initFormSteps() {
    var containers = document.querySelectorAll('.js--formsteps');
    if (!containers.length) return;

    containers.forEach(function (container) {
      new FormSteps(container);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFormSteps);
  } else {
    initFormSteps();
  }
})();
