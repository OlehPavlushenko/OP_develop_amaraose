class TabsComponent {
  constructor(settings) {
    this.options = Object.assign({
      activeClass: 'active',
      tabList: '.tabs-list',
      tabLink: '.tabs-list__item',
      container: '.tab-panel',
      switchEvent: 'click'
    }, settings)

    this.page = document.querySelector('html');
    this.btns = this.page.querySelectorAll(this.options.tabLink);

    this.btns.forEach(btn => {
      btn.addEventListener(this.options.switchEvent, this.onButtonClick.bind(this));
    });
  }

  onButtonClick(event) {
    event.preventDefault();

    let elem =  event.target.closest(this.options.tabList).querySelectorAll(this.options.tabLink);
    for (var i = 0; i < elem.length; i++) {
      elem[i].classList.remove(this.options.activeClass);
    }

    let clickedTab = event.currentTarget;
    clickedTab.classList.add(this.options.activeClass);

    event.preventDefault();

    let myContentPanel = document.querySelectorAll(this.options.container);
    for (i = 0; i < myContentPanel.length; i++) {
      myContentPanel[i].classList.remove(this.options.activeClass);
    }

    let anchorReference = event.target.closest("[href]")
    let activePanelId = anchorReference.getAttribute('href');
    let activePanel = document.querySelector(activePanelId);

    activePanel.classList.add(this.options.activeClass);
  }
}

const tabsSection = new TabsComponent();
