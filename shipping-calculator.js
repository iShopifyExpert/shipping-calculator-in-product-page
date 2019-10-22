(function(){

	"use strict";

	/* In case you want to output a bunch of things to the debug console */
	var debug = false;
	var cartCookie;

	/* The ID of the element that you want to add the shipping fields into */
	var productSection = document.getElementsByClassName('ShippingEstimator__Form');
    var productSectionReslt = document.getElementsByClassName('ShippingEstimator__Result');
	if(!productSection.length){ log('Could not find the element'); return }

	/* the main product select element */
	var productSelect = document.getElementById('product-select-{{ product.id }}');
	if(!productSelect){ log('Could not find the main select element'); return }

	/* create a message box */
	var shippingMessage = document.createElement('div');
	var shippingCountry = document.getElementById('productcountry'); //document.createElement('select');
	var shippingProvince = document.getElementById('productprovince'); //document.createElement('select');
	var shippingZip = document.createElement('input');
    $("body").on("change","#productcountry",function(){
      var option = $("#productcountry option:selected").data("provinces");
      $("#productprovince").html("<option value=''> Choose State</option>");
      if(option.length < 1){
        $("#productprovince").hide();
      }else{
        $("#productprovince").show();
      }
      for(var i=0; i<option.length; i++){
        $("#productprovince").append("<option value='"+option[i][1]+"'>"+option[i][0]+"</option>");
      }
    });
  
	/* We are just adding some dummy fields for example only. There's better ways to handle this */
	var initFields = function(){

		/* create the country picker */
      //var countries = [{{section.settings.scalcu_country}}];
		//for (var i = 0; i < countries.length; i++) {
		//	shippingCountry.add(new Option(countries[i], countries[i], i===0));
		//};
		//shippingCountry.name = 'shipping_address[country]';
        //shippingCountry.className = 'Form__Select Select';
        shippingMessage.className = 'ShippingEstimator__ResultsInner';
		/* create the province state picker */

		//var provinces = [{{section.settings.scalcu_states}}];
		//for (var i = 0; i < provinces.length; i++) {
		//	shippingProvince.add(new Option(provinces[i], provinces[i], i===0));
		//};
		//shippingProvince.name = 'shipping_address[province]';
        //shippingProvince.className = 'Form__Select Select';
		/* create the zip / postcode field */
		shippingZip.type = 'text';
        shippingZip.className = 'ShippingEstimator__Zip Form__Input';
		shippingZip.name = 'shipping_address[zip]';
		shippingZip.value = '';

		/* create a wrapper for the fields */
		var shippingCalcWrapper = document.createElement('div');
		shippingCalcWrapper.className = 'shipping-calc-wrapper ShippingEstimator Select--primary';

		/* create a title */
		var shippingCalcTitle = document.createElement('p');
		shippingCalcTitle.innerText = 'Estimativa de envio';

		/* create a get rates button */
		var shippingCalcButton = document.createElement('button');
		shippingCalcButton.innerText = 'Calcular';
		shippingCalcButton.className = 'ShippingEstimator__Submit Button Button--primary';
		shippingCalcButton.onclick=function(){
			if(!productSelect.value.length){ return false }
			cartCookie = getCookie('cart');
			var tempCookieValue = tempCookieValue || "temp-cart-cookie___" + Date.now();
			var fakeCookieValue = fakeCookieValue || "fake-cart-cookie___" + Date.now();

			/* if not found, make a new temp cookie */
			if(!cartCookie){ 
				log('no cookie found');
				updateCartCookie(tempCookieValue);
				cartCookie = getCookie('cart');
			}else{
				log('cookie found');
			}

			/* if found but has a weird length, bail */
			if(cartCookie.length < 32){ log('cart ID not valid');return }

			/* Change the cookie value to a new 32 character value */
			updateCartCookie(fakeCookieValue);
			log(getCookie('cart'));

			getRates(parseInt(productSelect.value));
			return false;
		};

		/* create some labels for the fields */
		var labelNames = ['Country','State','Postcode'];
		var labels = [];
		for (var i = 0; i < labelNames.length; i++) {
			var label = document.createElement('label');
			label.innerText = labelNames[i];
			labels.push(label);
		};

		shippingCalcWrapper.appendChild(labels[0]);
		//shippingCalcWrapper.appendChild(shippingCountry);
		shippingCalcWrapper.appendChild(labels[1]);
		//shippingCalcWrapper.appendChild(shippingProvince);
		shippingCalcWrapper.appendChild(labels[2]);
		shippingCalcWrapper.appendChild(shippingZip);
		shippingCalcWrapper.appendChild(shippingCalcButton);
		//shippingCalcWrapper.appendChild(shippingMessage);

		/* add to the page */
		productSection[0].appendChild(shippingCalcWrapper);
        productSectionReslt[0].appendChild(shippingMessage);

	};

	/* A console logging function */
	var log = function(a){
		if(!debug){ return }
		console.log(a);
	};

	/* get cookie by name */
	var getCookie = function(name) {
		var value = "; " + document.cookie;
		var parts = value.split('; '+name+'=');
		if (parts.length == 2) return parts.pop().split(";").shift();
	};

	/* update the cart cookie value */
	var updateCartCookie = function(a) {
		log('changing cart cookie value to: '+a);
		var date = new Date();
		date.setTime(date.getTime()+(14*86400000));
		var expires = '; expires='+date.toGMTString();
		document.cookie = 'cart='+a+expires+'; path=/';
	};

	/* reset the cart cookie value */
	var resetCartCookie = function(){
		updateCartCookie(cartCookie);
		log(getCookie('cart'));
	};

	/* get the rates */
	var getRates = function(variantId){

		/* add whatever sanity checks you need in addition to the one below */
		if(typeof variantId === 'undefined'){ return }

		/* the main quantity element */
		var productQuantity = document.getElementById('Quantity');

		var quantity = productQuantity ? parseInt(productQuantity.value):1;
		var addData = {
			'id':variantId,
			'quantity':quantity
		};

		fetch('/cart/add.js', {
			body: JSON.stringify(addData),
			credentials: 'same-origin',
			headers: {
				'Content-Type': 'application/json',
				'X-Requested-With':'xmlhttprequest' /* XMLHttpRequest is ok too, it's case insensitive */
			},
			method: 'POST'
		}).then(function(response) {
			return response.json();
		}).then(function(json) {
			/* we have JSON */
			console.log(json);
			/* Change the cookie value back to what it was */

			$.ajax({
				type: "GET",
				url: '/cart/shipping_rates.json',
				data: {
					'shipping_address[country]':shippingCountry.value,
					'shipping_address[province]':shippingProvince.value,
					'shipping_address[zip]':shippingZip.value
				},
				success: function(d){
					if(d.shipping_rates && d.shipping_rates.length == 1){
						shippingMessage.innerHTML = ''+d.shipping_rates[0].name+': R$'+d.shipping_rates[0].price;
					}
                  else if(d.shipping_rates && d.shipping_rates.length == 2){
                  shippingMessage.innerHTML = ''+d.shipping_rates[0].name+': R$'+d.shipping_rates[0].price+''+ '</br>'+d.shipping_rates[1].name+': R$'+d.shipping_rates[1].price;
                  }
                    else if(d.shipping_rates && d.shipping_rates.length == 3){
                    shippingMessage.innerHTML = ''+d.shipping_rates[0].name+': R$'+d.shipping_rates[0].price+''+ '</br>'+d.shipping_rates[1].name+': R$'+d.shipping_rates[1].price + '</br>'+d.shipping_rates[2].name+': R$'+d.shipping_rates[2].price;
                  }
                   else if(d.shipping_rates && d.shipping_rates.length == 4){
                    shippingMessage.innerHTML = ''+d.shipping_rates[0].name+': R$'+d.shipping_rates[0].price+''+ '</br>'+d.shipping_rates[1].name+': R$'+d.shipping_rates[1].price + '</br>'+d.shipping_rates[2].name+': R$'+d.shipping_rates[2].price  + '</br>'+d.shipping_rates[3].name+': R$'+d.shipping_rates[3].price;
                  }
                  else if(d.shipping_rates && d.shipping_rates.length == 5 ){
                    shippingMessage.innerHTML = ''+d.shipping_rates[0].name+': R$'+d.shipping_rates[0].price+''+ '</br>'+d.shipping_rates[1].name+': R$'+d.shipping_rates[1].price + '</br>'+d.shipping_rates[2].name+': R$'+d.shipping_rates[2].price  + '</br>'+d.shipping_rates[3].name+': R$'+d.shipping_rates[3].price   + '</br>'+d.shipping_rates[4].name+': R$'+d.shipping_rates[4].price;
                  }
                  
                    resetCartCookie()
				},
				error: function(){
					resetCartCookie();
					shippingMessage.innerHTML = '<div class="ShippingEstimator__Error Alert Alert--error" style="display: block;"><ul class="Alert__ErrorList"><li class="Alert__ErrorItem">zip não é válido para Estados Unidos</li></ul></div>';
				},
				dataType: 'json'
			});

			
		}).catch(function(err) {
			/* uh oh, we have error. */
            //shippingMessage.innerHTML = '<div class="ShippingEstimator__Error Alert Alert--error" style="display: block;"><ul class="Alert__ErrorList"><li class="Alert__ErrorItem">zip não é válido para Estados Unidos</li></ul></div>');
			console.error(err);
			resetCartCookie()
		});

	};

	initFields();

})()
