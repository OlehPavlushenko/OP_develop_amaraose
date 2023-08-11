class Burger {

  constructor(settings) {
    let flag, timer;

    this.options = Object.assign({
      container: 'header',
      onClickOutside: true,
      menuActiveClass: 'nav-active',
      menuOpener: '.nav-opener',
      menuDrop: '.nav-drop',
      toggleEvent: 'click',
      outsideClickEvent: 'click touchstart pointerdown MSPointerDown'.split(' '),
      resizeClass: 'resize',
      breakpoint: 768
    }, settings)

    //if isset opener and container elements
    if (document.querySelector(this.options.menuOpener) && document.querySelector(this.options.container)) {
      this.page = document.querySelector('html');
      this.container = this.page.querySelector(this.options.container);
      this.opener = this.container.querySelector(this.options.menuOpener);
      this.drop = this.container.querySelector(this.options.menuDrop);

      this._attachEvents();
    }
  }

  _attachEvents() {
    if (this._activateResizeHandler) {
      this._activateResizeHandler();
      this._activateResizeHandler = null;
    }

    this.opener.addEventListener(this.options.toggleEvent, this._openerClickHandler.bind(this));
  }

  _outsideClickHandler(e) {
    if (this._isOpened()) {
      if (!e.target.closest(this.options.menuOpener) && !e.target.closest(this.options.menuDrop)) {
        this._hide();
      }
    }
  }

  _openerClickHandler(e) {
    e.preventDefault();
    this._toggle();
  }

  _isOpened() {
    return this.container.classList.contains(this.options.menuActiveClass);
  }

  _show() {
    this.container.classList.add(this.options.menuActiveClass);
    if (this.options.onClickOutside) {
      this.options.outsideClickEvent.forEach((e) => {
          document.addEventListener(e, this._outsideClickHandler.bind(this));
        }
      )
    }
  }

  _hide() {
    this.container.classList.remove(this.options.menuActiveClass)
    if (this.options.onClickOutside) {
      this.options.outsideClickEvent.forEach((e) => {
          document.removeEventListener(e, this._outsideClickHandler.bind(this));
        }
      )
    }
  }

  _toggle() {
    if (this._isOpened()) {
      this._hide();
    } else {
      this._show();
    }
  }

  _activateResizeHandler() {
    this._removeClassHandler();
    window.addEventListener('resize', this._resizeHandler.bind(this));
  }

  _removeClassHandler() {
    this.flag = false;
    this.page.classList.remove(this.options.resizeClass);
  }

  _resizeHandler() {
    if (!this.flag) {
      this.flag = true;
      this.page.classList.add(this.options.resizeClass);
    }
    if (window.innerWidth > this.options.breakpoint && this._isOpened()) {
      this._hide();
    }
    clearTimeout(this.timer);
    this.timer = setTimeout(this._removeClassHandler.bind(this), 500);
  }
}

const burgerMenu = new Burger({
  container: '.account-menu__container',
  menuActiveClass: 'account-menu-active',
  menuOpener: '.account-menu__opener',
  menuDrop: '.account-menu',
  breakpoint: 991
});
