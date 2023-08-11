(function() {
    // 不在产品页面则推出
    if (window.ShopifyAnalytics.meta.page.pageType !== 'product') {
        return;
    }
    // 产品对象
    var product = JSON.parse(document.querySelector('#sealoop_product').textContent);
    // 产品ID
    var product_id = product.id;
    // 变体对象
    var variants = product.variants;
    // 选中的变体id
    var selected_variant_id = JSON.parse(document.querySelector('#sealoop_product_selected_or_first_variant').textContent);
    var selected_variant = null;
    var selected_variant_isExist_plan = false;
    // 对应的url选中变体(默认)
    var url_variant_id = window.location.href.split('variant=')[1];
    // 产品对应的计划列表
    var plan = product.selling_plan_groups;
    // 获取钱币格式
    var money_format = JSON.parse(document.querySelector('#sealoop_money_format').textContent);
    var priceformat = money_format.replace(/<[^>]+>/g, '').split('{')[0];

    // 一次购买对象
    var one_time = null;
    // 计划组对象
    var planDom = null;

    // 页面form表单对象数组
    var form_elementArr = document.forms;
    var shopify_payment_button = null;

    var description = null;

    if (!plan) {
        return;
    }

    isExistParentAndUpdateElement();

    // 验证对象是否存在
    function isExistParentAndUpdateElement() {
        if (form_elementArr != null) {
            for (let i = 0; i < form_elementArr.length; i++) {
                if (form_elementArr[i].action.indexOf('/cart/add') != -1) {
                    const children = form_elementArr[i].elements;

                    for (let i = 0; i < children.length; i++) {
                        if (children[i].getAttribute('type') === 'submit') {
                            shopify_payment_button = children[i].parentElement;
                            break;
                        }
                    }
                    if (shopify_payment_button) break;
                }
            }
        }
    }

    // 验证插入位置
    if (shopify_payment_button == null) {
        return;
    } else {
        let html = '<div id="sealoop_subscription_plan">' +
            '<input type="hidden" name="selling_plan" class="selling_plan"/>';
        html += '<div class="sub-plan-head"></div>';
        html += '<div class="sub-plan-group-box"></div></div>';
        shopify_payment_button.insertAdjacentHTML('afterBegin', html);
    }

    // 初始化
    function getVarData() {
        variants.forEach(v => {
            if (v.id == selected_variant_id) {
                selected_variant = v;
            }
        });

        initSubPlanGroup();
    }

    function initSubPlanGroup() {
        let html = '';
        selected_variant_isExist_plan = false;
        plan.forEach(vv => {
            // 判断计划是否属于该app
            if (vv.app_id == 'auto-subscription') {
                vv.price_data = [];

                selected_variant.selling_plan_allocations.forEach(v => {
                    // 判断选中变体订阅计划是否有对应的计划
                    vv.selling_plans.forEach(val => {
                        if (val.id == v.selling_plan_id) {
                            // 改变变体是否拥有计划状态
                            selected_variant_isExist_plan = true;
                            vv.price_data.push({
                                id: val.id,
                                price: returnFloat(v.price / 100),
                                per_delivery_price: v.per_delivery_price / 100
                            });
                            v.discount_type = val.price_adjustments[0].value_type;
                            v.discount_value = val.price_adjustments[0].value;
                        }

                        if (description != null) {
                            description.forEach(d => {
                                if (d.resource_id == val.id) {
                                    if (d.description == null) {
                                        d.description = '';
                                    }
                                    val.description = d.description;
                                }
                            });
                        }
                    });
                });
                // 添加订阅计划列表选项
                html += createHtml(vv);
            }
        });
        let headHtml = '';
        // 判断选中变体是否拥有计划
        if (selected_variant_isExist_plan) {
            // requires_selling_plan:是否仅限订阅购买
            if (!product.requires_selling_plan) {
                headHtml += `<legend id="purchase-options" class="sub_legend">Purchase Options</legend>
                    <div class="sub-plan-One-group">
                        <div class="sub-list-margin">
                            <label class="sub_label">
                                <input type="radio" class="sub-plan-selector-group-one" name="sub-plan-selector-group" value="" checked />
                                <span id="one-time-purchase" class="sub-text-margin">One Time Purchase</span>
                            </label>
                            <div class="sub-price-margin">
                            <span class="sub-price-one"> ${priceformat + returnFloat(selected_variant.price / 100)} </span>
                        </div>
                        </div>
                    </div>
                    `;
            } else {
                headHtml += '<legend id="purchase-options" class="sub_legend" style="display:none ">Purchase Options</legend>';
            }
            document.querySelector('.sub-plan-head').innerHTML = headHtml;

        }
        // 获取一次性购买对象
        one_time = document.querySelector('.sub-plan-One-group');
        one_timeListener();

        document.querySelector('.sub-plan-group-box').innerHTML = html;
        if (html == '') {
            document.querySelector('.sub-plan-group-box').style = '';
        } else {
            document.querySelector('#sealoop_subscription_plan').style = 'margin-bottom: 24px;';
        }
        const element = document.querySelectorAll('.sub-plan-group');

        if (one_time != null) {
            document.querySelector('.sub-plan-selector-group-one').click();
            one_time.style.borderBottom = '1px solid #dfe3e8';
        }

        if (element.length > 0) {
            for (let i = 0; i < element.length - 1; i++) {
                element[i].style.borderBottom = '0px';
            }
            if (one_time != null) {
                one_time.style.borderBottom = '0px solid #dfe3e8';
            }
        }

        if (one_time == null && document.querySelector('.sub-plan-selector-group') != null) {
            document.querySelector('.sub-plan-selector-group').click();
        }

    }

    function createHtml(plan) {
        let html = '';

        if (plan.price_data && plan.price_data.length > 0) {
            html = `<div class="sub-plan-group">
                <div class="sub-plan-text-div">
                    <div class="sub-list-margin">
                        <label class="sub_label">
                        <input type="radio" class="sub-plan-selector-group" name="sub-plan-selector-group" value="${plan.id}" />
                        <span id="subscribe-and-save" class="sub-text-margin">${plan.name}</span>
                        </label>
                        <div class="sub-price-margin">
                            <div><span class="sub-price-text">${priceformat + plan.price_data[0].price}</span></div>
                            <div class="sub-per-price-container"><span class="sub-per-price" style="font-size: 10px;"></span></div>
                        </div>
                    </div>
                </div>
                <div id="${plan.id}" class="sub-plan-Subscribe-group" style="margin-top: 18px;display:none">
                <div class="sub-plan-div">
                <label class="sub_label" id="delivery-every">Delivery every</label>`;
            plan.selling_plans.forEach(v => {
                plan.price_data.forEach(vv => {
                    if (vv.id == v.id) {
                        if (v.description == null) {
                            v.description = '';
                        }
                        html += `<label class="sub_label">
                        <input type="radio" value="${v.id}" data-price="${vv.price}" name="sub-plan-selector-group-item" class="sub-plan-selector-group-item">
                        <div class="sub-frequency-plan">
                            <span class="sub-plan-text">${v.options[0].value}</span>
                            <span id="description${v.id}" class="sub-plan-description" style="display:none">${v.description}</span>
                        </div>
                    </label>`;
                    }
                });
            });
            html += '</div></div></div>';
        }
        return html;
    }

    // 监听变体变化
    function VariantListener() {
        if (window.location.href.indexOf('variant=') != -1) {
            if (url_variant_id != window.location.href.split('variant=')[1]) {
                url_variant_id = window.location.href.split('variant=')[1];
                selected_variant_id = url_variant_id;
                getVarData();
            }
        }
        setTimeout(() => {
            VariantListener();
        }, 50);
    }

    // 一次性购买添加监听
    function one_timeListener() {
        if (one_time != null) {
            document.querySelector('.sub-plan-One-group').addEventListener('click', (evt) => {
                // 取消具体计划的选中
                const frequency_plan = document.querySelectorAll('.sub-plan-selector-group-item');
                frequency_plan.forEach(v => {
                    v.checked = false;
                });

                // 隐藏具体计划列表
                const dom = evt.target;
                if (dom.getAttribute('class') == 'sub-plan-selector-group-one') {
                    const arr = document.querySelectorAll('.sub-plan-Subscribe-group');
                    arr.forEach(v => {
                        v.style.display = 'none';
                    });
                    const perArr = document.querySelectorAll('.sub-per-price');
                    perArr.forEach(v => {
                        v.innerHTML = '';
                    });
                }
                // 改变价格和清除选中计划
                changePrice();
                document.querySelector('.selling_plan').value = '';
            });
        }
    }

    // 计划列表添加监听
    document.querySelector('.sub-plan-group-box').addEventListener('click', (evt) => {
        const dom = evt.target;
        checkGroupShow(dom);
    });

    function checkGroupShow(dom) {
        // 点击的是具体计划 ,修改价格
        if (dom.getAttribute('class') == 'sub-plan-selector-group-item') {
            changePrice();
            const plan = dom.parentNode.parentNode.parentNode;

            const frequency_planArr = plan.querySelectorAll('.sub-plan-selector-group-item');

            frequency_planArr.forEach(v => {
                if (v.value == dom.value) {
                    document.querySelector('#description' + v.value).style.display = '';
                } else {
                    document.querySelector('#description' + v.value).style.display = 'none';
                }
            });
        }
        // 点击的是计划组,则修改组件显示
        if (dom.getAttribute('class') == 'sub-plan-selector-group') {
            planDom = dom.parentNode.parentNode.parentNode;

            // 计划组radio
            const planArr = document.querySelectorAll('.sub-plan-selector-group');

            // 计划组对应具体计划div
            const frequencyDivArr = document.querySelectorAll('.sub-plan-Subscribe-group');

            // 单价显示
            const perArr = document.querySelectorAll('.sub-per-price');
            planArr.forEach((v, k) => {
                if (v == dom) {
                    frequencyDivArr[k].style.display = 'flex';
                    // 获取选中计划组第一个计划并选中
                    const frequency_plan = frequencyDivArr[k].querySelector('.sub-plan-selector-group-item');

                    frequency_plan.checked = true;
                    if (document.querySelector('#description' + frequency_plan.value).value != '') {
                        document.querySelector('#description' + frequency_plan.value).style.display = '';
                    }
                } else {
                    // 其他计划组计划列表隐藏
                    frequencyDivArr[k].style.display = 'none';
                    perArr[k].innerHTML = '';
                    const frequency_planArr = frequencyDivArr[k].querySelectorAll('.sub-plan-selector-group-item');
                    frequency_planArr.forEach(v => {
                        document.querySelector('#description' + v.value).style.display = 'none';
                    });
                }
            });
            changePrice();
        }
    }

    function changePrice() {
        // 获取具体计划列表
        const frequency_plan_Arr = document.querySelectorAll('.sub-plan-selector-group-item');
        let frequency_plan_id = 0;
        let frequency_plan_price = selected_variant.price / 100;

        frequency_plan_Arr.forEach(v => {
            if (v.checked) {
                frequency_plan_id = v.value;
                frequency_plan_price = v.getAttribute('data-price');
            }
        });

        let discount = 0;
        let compare_price = selected_variant.price / 100;
        // 改变所属计划组显示价格
        selected_variant.selling_plan_allocations.forEach(vv => {
            if (frequency_plan_id == vv.selling_plan_id) {
                const _price = returnFloat(vv.price / 100);
                const _per_price = returnFloat(vv.per_delivery_price / 100);
                compare_price = returnFloat(vv.compare_at_price / 100);
                const _dom = planDom.querySelector('.sub-price-text');

                _dom.innerHTML = priceformat + _price;

                if (_price != _per_price) {
                    planDom.querySelector('.sub-per-price').innerHTML = priceformat + _per_price + '/delivery';
                } else {
                    planDom.querySelector('.sub-per-price').innerHTML = '';
                }

                // 计算折扣属性
                if (vv.discount_type == 'fixed_amount') {
                    discount = priceformat + '' + vv.discount_value / 100;
                    if (vv.discount_value / 100 > selected_variant.price / 100) {
                        discount = priceformat + '' + selected_variant.price / 100;
                    }
                } else {
                    discount = vv.discount_value + '%';
                }
            }
        });

        // 赋予选中计划值
        if (document.querySelector('.selling_plan') != null) {
            document.querySelector('.selling_plan').value = frequency_plan_id;
        }

        // 改变价格
        if (document.querySelector('.price-item--regular') != null) {
            if (selected_variant.price / 100 != frequency_plan_price) {
                // 填充折扣样式
                const price_html = "<span class='sub-discount-price'>" + priceformat + frequency_plan_price + "</span><span class='sub-original-price' style='text-decoration: line-through;'>" + priceformat + compare_price + "</span><span class='sub-discount-description'>SAVE " + discount + '</span>';
                document.querySelector('.price-item--regular').innerHTML = price_html;
            } else {
                document.querySelector('.price-item--regular').innerHTML = priceformat + frequency_plan_price;
            }
        }
    }

    function selectDescription() {
        if (plan == null) {
            return;
        }
        let selling_plans = [];
        plan.forEach(v => {
            if (v.app_id != 'auto-subscription') {
                return;
            }

            v.selling_plans.forEach(s => {
                selling_plans.push(s.id);
            });
        });
        selling_plans = JSON.stringify(selling_plans);
        var request = new XMLHttpRequest();
        request.open('post', 'https://subapi.sealapps.com/api/v1/plan/Description?selling_plans_Id=' + selling_plans);
        request.send();
        request.onreadystatechange = function() {
            if (request.readyState == 4) {
                if (request.status == 200) {
                    description = JSON.parse(request.responseText);
                    description = description.data;
                    getVarData();
                }
            }
        };
    }
    function brandingHtml() {
        return `
            <div class="sub-plan-group-branding"> 
                <div class="sub-plan-group-branding-img">
                    <img src="https://cdn.shopify.com/s/files/applications/6db8ff5a82aca40cddc734190525a4c3_200x200.png" alt="Subscriptions Recurring Orders logo">
                </div>
                <div class="sub-plan-group-branding-div">Powered by <a href="https://apps.shopify.com/auto-subscriptions?from=branding" style="color: #2C6ECB;" target="_blank">Sealapps</a></div>
            </div>
            `;
    }
    function brandingIsShow() {
        if (plan == null) return;
        var domainNameDomain = document.domain;
        var request = new XMLHttpRequest();
        request.open('post', 'https://subapi.sealapps.com/api/v1/brandingIsShow?domain=' + domainNameDomain);
        request.responseType = 'json';

        request.send();
        request.onreadystatechange = function() {
            if (request.readyState == 4) {
                var brandingIsShowRes = request.response;
                if (brandingIsShowRes.code == 200) {
                    const data = brandingIsShowRes.data;
                    (data.branding == 1) ? document.querySelector('#sealoop_subscription_plan').insertAdjacentHTML('beforeend', brandingHtml()) : '';
                }
            }
        };
    }

    function returnFloat(value) {
        const decimals = value.toString().split('.');

        if (decimals.length == 1) {
            value = value.toString() + '.00';
            return value;
        }

        if (decimals.length > 1 && decimals[1].length < 2) {
            value = value.toString() + '0';
            return value;
        }

        return value;
    }
    // 挂载样式
    function importStyles() {
        const styles = `<style>
            .sub_legend {
              margin-bottom: 8px;
              margin-top: 8px;
              text-align: left;
              font-size: 16px;
              }
            
            .sub-plan-selector {
             	padding: 0;
              border: none;
              margin-bottom: 1em;
              flex-basis: 100%;
              width: 100%;
              overflow: hidden;
              text-align: left;
              }
            
            .sub-list-margin{
                display: flex;
                justify-content: space-between;
               margin: 0 15px;
               flex:auto;
            	 }
            
            .sub-plan-One-group {
              display: flex;
              border: 1px solid #dfe3e8;
              align-items: center;
              justify-content: center;
              height:55px;
              position: relative;
              }
            .sub-plan-group{
              display: flex;
              border: 1px solid #dfe3e8;
              flex-direction: column;
              flex-wrap: wrap;
              min-height: 55px;
              }
            .sub-plan-group-branding {
               display: flex;
               flex-direction: row;
               justify-content: flex-end;
               align-items: center;
               }
            .sub-plan-group-branding-img{
display: flex;
align-items: center;
               width: 14px;
margin-right: 4px;
               }
.sub-plan-group-branding-img img {
width: 100%;
}
            .sub-plan-group-branding-div{
               font-family: \Public Sans\;
               font-style: normal;
               font-weight: 400;
               text-align: center;
               color: #B0B0B0;
                font-size: 12px;
               }
            .sub-plan-text-div{
              flex: auto;
              display: flex;
              padding-top: 15px;
              position: relative;
              }
            .sub-plan-Subscribe-group {
              border-top:0px;
              border-bottom: 0px;
              flex-flow: column;
              padding-left: 41px;
              margin-top: -3px;
              padding-bottom: 13px;
              }
            
            .sub-plan-description{
              margin-left: 8px;
              font-size: 13px;
            }
            .sub-text-margin{
              margin-left: 8px;
              margin-right: 14px;
            }
            
            .sub-price-margin{
                text-align: right;
                position: relative;
              }
            .sub-per-price-container {
                position: absolute;
                right: 0;
            }
            .product-form input{
              min-height: 0px;
            }
            
            .sub-plan-item{
              margin-bottom: 24px;
            }
            .sub-plan-div{
              display: flex;
              flex-direction: column;
              flex-wrap: wrap;
              }
            .sub-frequency-plan{
              display: flex;
              flex-direction: column;
              max-width: 405px; 
              }
            .sub-plan-text{
              margin: 10px 0px 0px 8px;
              }
            
            .sub-discount-price{
              margin-right: 10px;
              text-decoration: none;
              color: #da4f49;
              }
            
            .sub-discount-description{
              margin-left: 10px;
              padding: 2px 6px;
              border: 1px solid #da4f49;
              border-radius: 3px;
              font-size: 10px;
              display: inline;
              position: relative;
              top: -3px;
              letter-spacing: 1px;
              color: #da4f49;
              }
            
            .sub_label{
              margin-bottom: 0px;
              text-transform:none;
              letter-spacing:0px;
              display: flex !important;
              align-items: baseline;
              text-align: left;
              font-size: 15px;
              }
            @media screen and (min-width:1024px){
              .sub-text-margin{
                  font-size:16px
               }
            }
            
            @media screen and (min-width:281px) and (max-width:360px) {
               .sub-list-margin{	
                   margin-left:3px
               }
               .sub-price-text{
                   font-size:13px;
               }
              .sub-price-one{
                   font-size:13px;
               }
              .sub-plan-Subscribe-group{
                   padding-left:30px
              }
            .sub-frequency-plan{
              max-width: 220px; 
              }
            }
            @media screen and (min-width:361px) and (max-width:500px) {
               .sub-price-text{
                   font-size:14px;
               }
               .sub-price-one{
                   font-size:14px;
               }
            .sub-frequency-plan{
              max-width: 260px; 
              }
            }
            @media screen and (min-width:540px) and (max-width:1024px){
               .sub-text-margin{
                   font-size:15px
               }
            .sub-frequency-plan{
              max-width: 380px; 
              }
            }
            @media screen and (max-width:280px){
               .sub-text-margin{
                   margin-right:0px
               }
            	 .sub-plan-Subscribe-group{
               	 padding-left:14px
               }
                .sub-list-margin{
               	 margin-left:0px
               }
               .sub-price-text {
                   font-size:12px;
               }
               .sub-price-one{
                   font-size:12px;
               }
               .sub-plan-text{
                   line-height:2;
               }
            .sub-frequency-plan{
              max-width: 200px; 
              }
            }</style>`;
        document.head.insertAdjacentHTML('beforeend', styles);
    }

    if (shopify_payment_button != null) {
        importStyles();
        selectDescription();
        VariantListener();
        brandingIsShow();
    }
})();
