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

        this.blockWrap = document.querySelector(".js-bundle-cart-wrap")
        this.blockEmpty = document.querySelector(".js-bundle-cart-empty")
        this.blockForm = document.querySelector(".js-bundle-cart-form")
        this.btnAdd = document.querySelectorAll(".js-btn-bundle-add")
        this.btnNext = document.querySelector(".js-bundle-cart-next")

        this.priceRegular = document.querySelector(".js-cart-price-regular")
        this.priceSale = document.querySelector(".js-cart-price-sale")

        this.itemSelected = document.querySelectorAll(
            ".js-bundle-cart-selected"
        )

        this.btnAdd.forEach((button) => {
            button.addEventListener("click", this.onButtonClick.bind(this))
        })

        this.loadProducts()

        this.btnNext.addEventListener(
            "click",
            function (event) {
                event.preventDefault()
                localStorage.removeItem("productsBundle")
                this.blockForm.submit()
            }.bind(this)
        )
    }

    onButtonClick(event) {
        event.preventDefault()

        const id = event.currentTarget.dataset.productId
        const name = event.currentTarget.dataset.handle
        console.log(event.currentTarget, id, name)
        this.addProduct(id, name, 1, event)
        this.loadProducts(event)
    }

    addProduct(id, name, quantity, event) {
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

    loadProducts() {
        let products = JSON.parse(localStorage.getItem("productsBundle")) || []
        let productNames = products.map((product) => product.name)
        let productQty = products.map((product) => product.quantity)
        let sumQty = productQty.reduce((total, value) => total + value, 0)
        let namesString = productNames.join("=")

        console.log(namesString)

        let blockResults = document.querySelector(".js-list-container")

        if (namesString) {
            fetch(
                window.Shopify.routes.root +
                    "collections/all?section_id=list-grid-bundle&handle=" +
                    encodeURIComponent(namesString)
            )
                .then((response) => {
                    if (!response.ok) {
                        throw new Error("Network response was not ok")
                    }
                    return response.text()
                })
                .then((text) => {
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
                })
                .catch((error) => {
                    console.error("Error:", error)
                })

            let sumPrice = this.sumPrice(products)
            let totalPrice = Shopify.formatMoney(sumPrice)
            console.log(sumPrice, totalPrice)

            if (sumQty <= 2) {
                this.itemSelected[0].style.display = "block"
                this.itemSelected[1].style.display = "none"
                this.itemSelected[2].style.display = "none"

                const discountedPercentage =
                    parseFloat(
                        this.itemSelected[0].getAttribute("data-discounted")
                    ) / 100
                const discountedAmount = sumPrice * discountedPercentage
                const finalAmount = Shopify.formatMoney(
                    sumPrice - discountedAmount
                )

                this.priceSale.textContent = finalAmount
                this.priceRegular.textContent = totalPrice
            } else if (sumQty === 3) {
                this.itemSelected[0].style.display = "none"
                this.itemSelected[1].style.display = "block"
                this.itemSelected[2].style.display = "none"

                const discountedPercentage =
                    parseFloat(
                        this.itemSelected[1].getAttribute("data-discounted")
                    ) / 100
                const discountedAmount = sumPrice * discountedPercentage
                const finalAmount = Shopify.formatMoney(
                    sumPrice - discountedAmount
                )

                this.priceSale.textContent = finalAmount
                this.priceRegular.textContent = totalPrice
            } else if (sumQty >= 4) {
                this.itemSelected[0].style.display = "none"
                this.itemSelected[1].style.display = "none"
                this.itemSelected[2].style.display = "block"

                const discountedPercentage =
                    parseFloat(
                        this.itemSelected[2].getAttribute("data-discounted")
                    ) / 100
                const discountedAmount = sumPrice * discountedPercentage
                const finalAmount = Shopify.formatMoney(
                    sumPrice - discountedAmount
                )

                this.priceSale.textContent = finalAmount
                this.priceRegular.textContent = totalPrice
            }

            if (sumQty == 1) {
                this.blockEmpty.classList.add("hidden")
                this.blockWrap.classList.add("in-progress")
                this.btnNext.classList.add("disabled")
                this.priceSale.textContent = totalPrice
                this.priceRegular.textContent = ""
            } else {
                this.btnNext.classList.remove("disabled")
            }
        } else {
            this.blockEmpty.classList.remove("hidden")
            this.blockWrap.classList.remove("in-progress")
            this.blockForm.classList.add("hidden")
        }
    }

    deleteProduct(id) {
        let products = JSON.parse(localStorage.getItem("productsBundle")) || []

        let existingProductIndex = products.findIndex(
            (product) => product.id === id
        )

        if (existingProductIndex === -1) {
            return //product not found
        }

        products.splice(existingProductIndex, 1)
        localStorage.setItem("productsBundle", JSON.stringify(products))

        let productQty = products.map((product) => product.quantity)
        let sumQty = productQty.reduce((total, value) => total + value, 0)
        console.log(sumQty)

        if (products.length == 0) {
            this.blockEmpty.classList.remove("hidden")
            this.blockForm.classList.add("hidden")
        }

        console.log("existingProductIndex", products.length)
        let sumPrice = this.sumPrice(products)
        let totalPrice = Shopify.formatMoney(sumPrice)

        console.log(sumPrice, totalPrice)

        if (sumQty <= 2) {
            this.itemSelected[0].style.display = "block"
            this.itemSelected[1].style.display = "none"
            this.itemSelected[2].style.display = "none"

            const discountedPercentage =
                parseFloat(
                    this.itemSelected[0].getAttribute("data-discounted")
                ) / 100
            const discountedAmount = sumPrice * discountedPercentage
            const finalAmount = Shopify.formatMoney(sumPrice - discountedAmount)
            this.priceSale.textContent = finalAmount
            this.priceRegular.textContent = totalPrice
        } else if (sumQty === 3) {
            this.itemSelected[0].style.display = "none"
            this.itemSelected[1].style.display = "block"
            this.itemSelected[2].style.display = "none"

            const discountedPercentage =
                parseFloat(
                    this.itemSelected[1].getAttribute("data-discounted")
                ) / 100
            const discountedAmount = sumPrice * discountedPercentage
            const finalAmount = Shopify.formatMoney(sumPrice - discountedAmount)
            this.priceSale.textContent = finalAmount
            this.priceRegular.textContent = totalPrice
        } else if (sumQty >= 4) {
            this.itemSelected[0].style.display = "none"
            this.itemSelected[1].style.display = "none"
            this.itemSelected[2].style.display = "block"

            const discountedPercentage =
                parseFloat(
                    this.itemSelected[2].getAttribute("data-discounted")
                ) / 100
            const discountedAmount = sumPrice * discountedPercentage
            const finalAmount = Shopify.formatMoney(sumPrice - discountedAmount)

            this.priceSale.textContent = finalAmount
            this.priceRegular.textContent = totalPrice
        }

        if (sumQty == 1) {
            this.btnNext.classList.add("disabled")
            this.priceSale.textContent = totalPrice
            this.priceRegular.textContent = ""
        } else {
            this.btnNext.classList.remove("disabled")
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
}

customElements.define("bundle-section", BundleSection)
