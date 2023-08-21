// Bundle Collection
//Recommend

Shopify.formatMoney = function (cents, format) {
  if (typeof cents == "string") {
    cents = cents.replace(".", "")
  }
  var value = ""
  var placeholderRegex = /\{\{\s*(\w+)\s*\}\}/
  var formatString = format || this.money_format

  function defaultOption(opt, def) {
    return typeof opt == "undefined" ? def : opt
  }

  function formatWithDelimiters(number, precision, thousands, decimal) {
    precision = defaultOption(precision, 2)
    thousands = defaultOption(thousands, ",")
    decimal = defaultOption(decimal, ".")

    if (isNaN(number) || number == null) {
      return 0
    }

    number = (number / 100.0).toFixed(precision)

    var parts = number.split("."),
      dollars = parts[0].replace(
        /(\d)(?=(\d\d\d)+(?!\d))/g,
        "$1" + thousands
      ),
      cents = parts[1] ? decimal + parts[1] : ""

    return dollars + cents
  }

  switch (formatString.match(placeholderRegex)[1]) {
    case "amount":
      value = formatWithDelimiters(cents, 2)
      break
    case "amount_no_decimals":
      value = formatWithDelimiters(cents, 0)
      break
    case "amount_with_comma_separator":
      value = formatWithDelimiters(cents, 2, ".", ",")
      break
    case "amount_no_decimals_with_comma_separator":
      value = formatWithDelimiters(cents, 0, ".", ",")
      break
  }

  return formatString.replace(placeholderRegex, value)
}

class BundleSection extends HTMLElement {
  constructor() {
    super()

    this.wrapRecommend = this.querySelector(".js-bundle-cart-recommend-wrap")
    this.backRecommend = this.querySelector(".js-bundle-cart-recommend-back")
    this.nextRecommend = this.querySelector(".js-bundle-cart-recommend-next")
    this.countSelectedRecommend = document.querySelector(".js-recommend-count-selected")

    this.blockWrap = document.querySelector(".js-bundle-cart-wrap")
    this.blockEmpty = document.querySelector(".js-bundle-cart-empty")
    this.blockForm = document.querySelector(".js-bundle-cart-form")
    this.btnAdd = document.querySelectorAll(".js-btn-bundle-add")

    this.btnNext = document.querySelector(".js-bundle-cart-next")
    this.countSelected = document.querySelectorAll(".js-count-selected")
    
    this.countDiscount = document.querySelectorAll(".js-count-discount")

    this.priceRegular = document.querySelectorAll(".js-cart-price-regular")
    this.priceSale = document.querySelectorAll(".js-cart-price-sale")

    this.itemSelected = document.querySelectorAll(
      ".js-bundle-cart-selected"
    )

    this.itemSelectedHeader = document.querySelector(
      ".js-count-selected-header"
    )

    this.btnAdd.forEach((button) => {
      button.addEventListener("click", this.onButtonClick.bind(this))
    })

    this.loadProducts()

    this.btnNext.addEventListener("click", (event) => {
      event.preventDefault()
      event.currentTarget.classList.add('in-progress')
      document.querySelector('#checkout').submit();
    })

    this.nextRecommend.addEventListener("click", async (event) => {
      event.preventDefault()
      event.currentTarget.classList.add('in-progress')
      setTimeout(() => {
        this.wrapRecommend.classList.add("open")
        this.blockForm.classList.add("closed")
        this.nextRecommend.classList.remove('in-progress')
      }, 500);


      const cartCount = await this.countCartList();
      const countSelected = parseInt(this.itemSelectedHeader.textContent)
      this.itemSelectedHeader.textContent = countSelected + cartCount

    })

    this.backRecommend.addEventListener("click", async (event) => {
      event.preventDefault()
      this.wrapRecommend.classList.remove("open")
      this.blockForm.classList.remove("closed")
      const cartCount = await this.countCartList();
      const countSelected = parseInt(this.itemSelectedHeader.textContent)
      this.itemSelectedHeader.textContent = countSelected - cartCount
    })
  }

  async getCartDataFromShopify() {
    try {
      const response = await fetch(window.Shopify.routes.root + 'cart.js');
      const data = await response.json();
      const cartItems = data.items.map(item => ({
        id: item.product_id,
        variant_id: item.variant_id,
        name: item.handle,
        quantity: item.quantity,
      }));

      return cartItems;
    } catch (error) {
      console.error('Error fetching cart data:', error);
      return false;
    }
  }

  addToCartAlltWithAjax(formData) {
    return new Promise((resolve, reject) => {
      fetch(window.Shopify.routes.root + "cart/add.js", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })
        .then((response) => response.json())
        .then((data) => {
          resolve(data);
        })
        .catch((error) => {
          console.error("Eror", error);
          reject(error);
        });
    });
  }

  changeCartAlltWithAjax(formData) {
    return new Promise((resolve, reject) => {
      fetch(window.Shopify.routes.root + "cart/update.js", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })
        .then((response) => response.json())
        .then((data) => {
          resolve(data);
        })
        .catch((error) => {
          console.error("Eror", error);
          reject(error);
        });
    });
  }

  async onButtonClick(event) {
    event.preventDefault()
    const id = event.currentTarget.dataset.variantId
    this.addProduct(id, event)

  }

  async addProduct(id, event) {
    let current = event.currentTarget
    let formData = {
      'items': [{
        'id': parseInt(id),
        'quantity': 1
      }]
    };

    this.addToCartAlltWithAjax(formData)
      .then((data) => {
        if (data.status) {
          let infoError = current.closest(".js-card-item").querySelector(".js-error-info")
          console.error("Add to Cart Error:", data.message + data.description);
          infoError.textContent = "Error: " + data.description
          setTimeout(() => {
            current.classList.remove('active')
            infoError.textContent = ""
          }, 3000);
        }else {
          this.loadProducts()
        }
      })
      .catch((error) => {
        console.error("Error added item:", error);
      });
    event.currentTarget.classList.add("active")
  }

  async deleteProduct(id, event) {
    let current = event
    current.classList.add('in-progress')
    const formItem = {
      updates: {
        [parseInt(id)]: 0,
      },
    };

    this.changeCartAlltWithAjax(formItem)
      .then((data) => {
        if (data.status) {
          let infoError = current.closest(".js-card-item").querySelector(".js-error-info")
          console.error("Add to Cart Error:", data.message + data.description);
          infoError.textContent = "Error: " + data.description
          setTimeout(() => {
            current.classList.remove('active')
            infoError.textContent = ""
          }, 3000);
        }else {
          this.loadProducts()
          current.closest(".js-card-item").remove()
        }
      })
      .catch((error) => {
        console.error("Error update item:", error);
      });
  }

  async loadProducts() {
    let cartData = await this.getCartDataFromShopify()
    const newProducts = [];

    this.btnAdd.forEach((button) => {
      const productId = parseInt(button.getAttribute('data-product-id'));

      const matchingCartItem = cartData.find(item => item.id === productId);
      if (matchingCartItem) {
        newProducts.push({
          id: matchingCartItem.id.toString(),
          name: matchingCartItem.name,
          quantity: matchingCartItem.quantity,
        });
      }
    });

    localStorage.setItem('productsBundle', JSON.stringify(newProducts));

    let products = JSON.parse(localStorage.getItem("productsBundle")) || []
    let productNames = products.map((product) => product.name)
    let productQty = products.map((product) => product.quantity)
    let sumQty = productQty.reduce((total, value) => total + value, 0)
    let namesString = productNames.join("=")
    let listPrice = document.querySelectorAll(".js-bundle-all-price")
    let blockResults = document.querySelector(".js-list-container")


    if (namesString) {
      try {
        const response = await fetch(
          window.Shopify.routes.root +
          "collections/all?section_id=list-grid-bundle&handle=" +
          encodeURIComponent(namesString)
        )

        if (!response.ok) {
          throw new Error("Network response was not ok")
        }

        const text = await response.text()
        const html = document.createElement("div")
        html.innerHTML = text
        const sectionBlock = html.querySelector(".js-section-block")

        if (sectionBlock && sectionBlock.innerHTML.trim().length) {
          blockResults.innerHTML = sectionBlock.innerHTML

          this.btnAdd.forEach((button) => {
            button.classList.remove("active")
          })

          this.blockWrap.classList.remove("in-progress")
          this.blockEmpty.classList.add("hidden")
          this.blockForm.classList.remove("hidden")

          let btnRemove = blockResults.querySelectorAll(
            ".js-btn-bundle-remove"
          )

          btnRemove.forEach((item) => {
            item.addEventListener("click", (event) => {
              event.preventDefault()
              const element = event.currentTarget
                const deleteId = element.dataset.variantId
                this.deleteProduct(deleteId, element)
            })
          })
        }
      } catch (error) {
        console.error("Error:", error)
      }

      let sumPrice = this.sumPrice(products)

      this.countSelected.forEach((element) => {
        element.textContent = sumQty !== "" ? sumQty : "0"
      })

      let displayIndex = 0 // Default index

      if (sumQty === 2) {
        displayIndex = 1
      } else if (sumQty === 3) {
        displayIndex = 2
      } else if (sumQty >= 4) {
        displayIndex = 3
      }

      this.updateDisplay(displayIndex, sumPrice)
      this.updateButtonQuantities(products)
    } else {
      this.blockEmpty.classList.remove("hidden")
      this.blockWrap.classList.remove("in-progress")
      this.blockForm.classList.add("hidden")

      this.countSelected.forEach((element) => {
        element.textContent = "0"
      })
      this.priceRegular.forEach((element) => {
        element.textContent = ""
      })
      this.priceSale.forEach((element) => {
        element.textContent = ""
      })
      listPrice.forEach((element) => {
        const price = parseInt(element.getAttribute("data-price-list"))
        element.textContent = Shopify.formatMoney(price)
      })
    }

    const cartCount = await this.countCartList();
    const countSelected = parseInt(this.countSelectedRecommend.textContent)
    this.countSelectedRecommend.textContent = countSelected + cartCount
  }

  async countCartList() {
    const products = JSON.parse(localStorage.getItem("productsBundle")) || []
    const cartItemIds = await this.getCartDataFromShopify();
    const countHasMatchInCartNotList =  cartItemIds.filter(cartItem => {
      return !products.some(localProduct => localProduct.id === cartItem.id.toString());
    });
    const sumQuantity = countHasMatchInCartNotList.reduce((totalQuantity, product) => {
      return totalQuantity + product.quantity;
    }, 0);
    return sumQuantity
  }

  updateDisplay(displayIndex, sumPrice) {
    let totalPrice = Shopify.formatMoney(sumPrice)
    let listPrice = document.querySelectorAll(".js-bundle-all-price")

    this.itemSelected.forEach((item, index) => {
      if (displayIndex === index && displayIndex != 0) {
        this.countDiscount.forEach((element) => {
          element.textContent = item.querySelector(
            ".js-count-discount-text"
          ).textContent
        })
      }
    })

    let discountedPercentage =
      parseFloat(
        this.itemSelected[displayIndex].getAttribute("data-discounted")
      ) / 100
    const discountedAmount = sumPrice * discountedPercentage

    const finalAmount = Shopify.formatMoney(sumPrice - discountedAmount)

    if (displayIndex === 0) {
      this.btnNext.classList.add("disabled")

      this.priceRegular.forEach((element) => {
        element.textContent = ""
      })
      this.priceSale.forEach((element) => {
        element.textContent = totalPrice
      })
      this.countDiscount.forEach((element) => {
        element.textContent = ""
        element.classList.add("hidden")
      })
      listPrice.forEach((element) => {
        const price = parseInt(element.getAttribute("data-price-list"))
        element.textContent = Shopify.formatMoney(price)
      })
    } else {
      this.btnNext.classList.remove("disabled")
      this.priceRegular.forEach((element) => {
        element.textContent = totalPrice
      })
      this.priceSale.forEach((element) => {
        element.textContent = finalAmount
      })
      this.countDiscount.forEach((element) => {
        element.classList.remove("hidden")
      })

      listPrice.forEach((element) => {
        const price = parseInt(element.getAttribute("data-price-list"))
        const discountedPrice = price * discountedPercentage
        element.textContent = Shopify.formatMoney(
          price - discountedPrice
        )
      })
    }
  }

  sumPrice(products) {
    const priceElements = document.querySelectorAll(".js-bundle-price")

    let totalSum = 0
    let productPrices = {}

    // Create a map of product prices based on their IDs
    priceElements.forEach((element) => {
      const price = parseInt(element.getAttribute("data-price"))
      const priceId = element.getAttribute("data-price-id")
      productPrices[priceId] = price
    })

    // Calculate the total sum
    products.forEach((product) => {
      const { id, quantity } = product
      if (productPrices[id] !== undefined) {
        totalSum +=
          quantity > 1
            ? productPrices[id] * quantity
            : productPrices[id]
      }
    })

    return totalSum
  }

  updateButtonQuantities(products) {
    this.btnQty = document.querySelectorAll(".js-qty-bundle")
    this.countQty = document.querySelectorAll(".js-bundle-cart-price-count")

    this.btnQty.forEach((button) => {
      const id = button.getAttribute("data-product-id")
      const product = products.find((p) => p.id === id)
      const quantity = product ? product.quantity : 1
      button.value = quantity
    })

    this.countQty.forEach((count) => {
      const id = count.getAttribute("data-product-id")
      const product = products.find((p) => p.id === id)
      const quantity = product ? product.quantity : 1
      count.textContent = quantity
    })
  }

  
}

customElements.define("bundle-section", BundleSection)

class BundleRecommendBlock extends HTMLElement {
  constructor() {
    super()

    this.addRecommendCart = this.querySelectorAll(".js-btn-bundle-add-recommend")
    this.countSelectedRecommend = document.querySelector(".js-recommend-count-selected")
    this.addRecommendCart.forEach(element => {
      element.addEventListener("click", (event) => {
        event.preventDefault()
        this.onClick(event)
      })
    });

    this.updateRecommendButtons();
  }

  async getCartDataFromShopify() {
    try {
      const response = await fetch(window.Shopify.routes.root + 'cart.js');
      const data = await response.json();
      const cartItems = data.items.map(item => ({
        id: item.product_id,
        variant_id: item.variant_id,
        name: item.handle,
        quantity: item.quantity,
      }));

      return cartItems;
    } catch (error) {
      console.error('Error fetching cart data:', error);
      return false;
    }
  }

  async updateRecommendButtons() {
    const cartItemIds = await this.getCartDataFromShopify();
    if (cartItemIds && cartItemIds.length > 0) {
      this.addRecommendCart.forEach(button => {
        const productId = button.getAttribute('data-product-id');
        const matchingCartItem = cartItemIds.find(item => item.variant_id === parseInt(productId));
        if (matchingCartItem) {
          const qty = button.closest('.js-card-item').querySelector('.js-bundle-cart-price-count2')
          button.classList.add('in-has');
          qty.textContent = matchingCartItem.quantity;
        }
      });
    }
  }


  onClick(event) {
    let current = event.currentTarget
    current.classList.add('in-progress')
    const productId = current.getAttribute("data-product-id")

    if (current.classList.contains('in-has')) {
      const formData = {
        updates: {
          [parseInt(productId)]: 0,
        },
      };
      this.changeCart(formData, current)
    }else {
      const formData = {
        'items': [{
          'id': parseInt(productId),
          'quantity': 1
        }]
      };
      this.addToCart(formData, current)
    }
  }

  addToCart(formData, current) {
    let event = current;
    fetch(window.Shopify.routes.root + "cart/add.js", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
    })
    .then((response) => response.json())
    .then((data) => {
        if (data.status) {
          event.classList.remove('in-progress');
          let infoError = event.closest(".js-card-item").querySelector(".js-error-info");
          infoError.textContent = "Error: " + data.description;
          setTimeout(() => {
              infoError.textContent = "";
          }, 3000);
        }else {
          event.classList.remove('in-progress');
          event.classList.add('in-has');
          const countSelected = parseInt(this.countSelectedRecommend.textContent);
          this.countSelectedRecommend.textContent = countSelected + 1;
        }
    })
    .catch((error) => {
        console.error(error);
    });
  }

  changeCart(formData, current) {
    let event = current
    fetch(window.Shopify.routes.root + "cart/update.js", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    })
    .then((response) => response.json())
    .then((data) => {
      if (data.status) {
        event.classList.remove('in-progress');
        let infoError = event.closest(".js-card-item").querySelector(".js-error-info");
        infoError.textContent = "Error: " + data.message;
        setTimeout(() => {
            infoError.textContent = "";
        }, 3000);
      }else {
        event.classList.remove('in-progress');
        event.classList.remove('in-has');
        const countSelected = parseInt(this.countSelectedRecommend.textContent);
        this.countSelectedRecommend.textContent = countSelected - 1;
        const qty = event.closest('.js-card-item').querySelector('.js-bundle-cart-price-count2');
        qty.textContent = 1;
      }
     
    })
    .catch((error) => {
      console.error(error);
  });
  }
  
}

customElements.define("recommend-block", BundleRecommendBlock)

class ToggleMobile extends HTMLElement {
  constructor() {
    super()
    this.sectionBundle = document.querySelector(".js-section-bundle")
    this.bundleCart = document.querySelector(".js-bundle-cart")
    this.toggle = this.querySelector(".js-accordion-toggle")
    this.content = this.querySelector(".js-accordion-content")


    this.toggle.addEventListener("click", this.onClick.bind(this))
    this.addEventListener("keyup", this.onKeyUp.bind(this))

    
    window.addEventListener("scroll", this.handleScroll.bind(this))
  }

  onClick(event) {
    event.preventDefault()
    event.target.classList.contains("open") ? this.close() : this.open()
  }

  open() {
    this.toggle.classList.add("open")
    this.content.classList.add("open")
    this.content.classList.remove("close")
    document.body.classList.add("overflow-hidden")
  }

  close() {
    this.toggle.classList.remove("open")
    this.content.classList.remove("open")
    this.content.classList.add("close")
    document.body.classList.remove("overflow-hidden")
  }

  onKeyUp(event) {
    if (event.code.toUpperCase() !== "ESCAPE") return
    if (
      event.target.classList.contains("js-accordion-toggle") &&
      event.target.classList.contains("open")
    ) {
      this.close()
    }
  }

  handleScroll() {
    const sectionRect = this.sectionBundle.getBoundingClientRect()
    const windowHeight = window.innerHeight

    const offset = windowHeight / 2

    if (sectionRect.top <= offset && sectionRect.bottom - offset >= 0) {
      this.bundleCart.style.display = "block"
    } else {
      this.bundleCart.style.display = "none"
      this.content.classList.remove("close")
    }
  }
}

customElements.define("toggle-mobile", ToggleMobile)