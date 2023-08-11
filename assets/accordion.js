class AccordionComponent {

  constructor(settings) {
    this.options = Object.assign({
      activeClass: 'active',
      accordionOpener: '.accordion__btn-opener',
      container: '.accordion__slide',
      toggleEvent: 'click',
      toggle: true
    }, settings)

    this.page = document.querySelector('html');
    this.accordions = this.page.querySelectorAll(this.options.container);
    this.btns = this.page.querySelectorAll(this.options.accordionOpener);

    this.btns.forEach(btn => {
      btn.addEventListener(this.options.toggleEvent, this.onButtonClick.bind(this));
    });
  }

  closeAllElements() {
    this.accordions.forEach(accordion => {
      if (accordion.classList.contains(this.options.activeClass)) {
        accordion.classList.remove(this.options.activeClass);
      }
    });
  }

  onButtonClick(event) {
    event.preventDefault();
    let elem =  event.target.closest(this.options.container);

    if (elem.classList.contains(this.options.activeClass)) {
      elem.classList.remove(this.options.activeClass);
    } else {
      if(this.options.toggle) {
        this.closeAllElements(elem);
      }
      elem.classList.add(this.options.activeClass);
    }
  }
}

const accordionSection = new AccordionComponent();
