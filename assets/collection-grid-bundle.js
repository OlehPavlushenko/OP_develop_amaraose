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

        this.toggle = this.querySelector(".js-accordion-toggle")
        this.content = this.querySelector(".js-accordion-content")

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

        this.toggle.addEventListener("click", this.onClick.bind(this))
        this.addEventListener("keyup", this.onKeyUp.bind(this))

        this.btnAdd.forEach((button) => {
            button.addEventListener("click", this.onButtonClick.bind(this))
        })

        this.loadProducts()

        this.btnNext.addEventListener("click", (event) => {
            event.preventDefault()
            this.addToCartAllProducts()
        })

        this.sectionBundle = document.querySelector(".js-section-bundle")
        this.bundleCart = document.querySelector(".js-bundle-cart")

        window.addEventListener("scroll", this.handleScroll.bind(this))
    }

    addToCartAllProducts() {
        const productInputs = this.blockForm.querySelectorAll(".js-qty-bundle")
        const formData = {
            items: [],
        }
        productInputs.forEach((input) => {
            const productId = input.getAttribute("data-variant-id")
            const quantity = parseInt(input.value)
            formData.items.push({
                id: productId,
                quantity: quantity,
            })
        })
        this.addToCartWithAjax(formData)
    }

    addToCartWithAjax(formData) {
        fetch(window.Shopify.routes.root + "cart/add.js", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(formData),
        })
            .then((response) => response.json())
            .then((data) => {
                window.location.href = "/cart"
                localStorage.removeItem("productsBundle")
            })
            .catch((error) => {
                console.error("Eror", error)
            })
    }

    handleScroll() {
        const sectionRect = this.sectionBundle.getBoundingClientRect()
        const windowHeight = window.innerHeight

        const offset = windowHeight / 2

        if (sectionRect.top <= offset && sectionRect.bottom - offset >= 0) {
            this.bundleCart.style.display = "block"
        } else {
            this.bundleCart.style.display = "none"
        }
    }

    onClick(event) {
        event.preventDefault()
        event.target.classList.contains("open") ? this.close() : this.open()
    }

    open() {
        this.toggle.classList.add("open")
        this.content.classList.add("open")
        document.body.classList.add("overflow-hidden")
    }

    close() {
        this.toggle.classList.remove("open")
        this.content.classList.remove("open")
        document.body.classList.remove("overflow-hidden")
    }

    onKeyUp(event) {
        console.log(event)
        if (event.code.toUpperCase() !== "ESCAPE") return
        if (
            event.target.classList.contains("js-accordion-toggle") &&
            event.target.classList.contains("open")
        ) {
            this.close()
        }
    }

    async onButtonClick(event) {
        event.preventDefault()

        const id = event.currentTarget.dataset.productId
        const name = event.currentTarget.dataset.handle
        console.log(event.currentTarget, id, name)
        this.addProduct(id, name, 1, event)
        await this.loadProducts()
    }

    async addProduct(id, name, quantity, event) {
        const newProduct = {
            id,
            name,
            quantity,
        }

        let products = JSON.parse(localStorage.getItem("productsBundle")) || []

        const existingProductIndex = products.findIndex(
            (product) => product.id === id
        )

        if (existingProductIndex !== -1) {
            // Product already exists, update the quantity
            products[existingProductIndex].quantity += quantity
        } else {
            products.push(newProduct)
        }

        localStorage.setItem("productsBundle", JSON.stringify(products))
        event.currentTarget.classList.add("active")
    }

    async loadProducts() {
        let products = JSON.parse(localStorage.getItem("productsBundle")) || []
        let productNames = products.map((product) => product.name)
        let productQty = products.map((product) => product.quantity)
        let sumQty = productQty.reduce((total, value) => total + value, 0)
        let namesString = productNames.join("=")
        let listPrice = document.querySelectorAll(".js-bundle-all-price")

        console.log(namesString)

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
                            setTimeout(() => {
                                element.closest(".js-card-item").remove()
                                const deleteId = element.dataset.productId
                                this.deleteProduct(deleteId)
                            }, 300)
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
    }

    async deleteProduct(id) {
        let products = JSON.parse(localStorage.getItem("productsBundle")) || []

        let existingProductIndex = products.findIndex(
            (product) => product.id === id
        )

        if (existingProductIndex === -1) {
            return //product not found
        }

        products.splice(existingProductIndex, 1)
        localStorage.setItem("productsBundle", JSON.stringify(products))

        await this.loadProducts()
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
        this.btnQty.forEach((button) => {
            const id = button.getAttribute("data-product-id")
            const product = products.find((p) => p.id === id)
            const quantity = product ? product.quantity : 1
            button.value = quantity
        })
    }
}

customElements.define("bundle-section", BundleSection)
