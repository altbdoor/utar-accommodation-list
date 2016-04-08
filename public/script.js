(function (d, w) {
	var cdnPath = './',
		
		filterType = $('.form-filter-type'),
		filterPriceMin = $('#form-filter-price-min'),
		filterPriceMax = $('#form-filter-price-max'),
		filterAddress = $('#form-filter-address'),
		
		campus = $('#form-campus'),
		
		results = $('#results-container'),
		template = $('#results-template').html();
	
	$.ajax({
		beforeSend: function (request) {
			request.setRequestHeader('Accept', 'application/vnd.github.v3+json');
		},
		dataType: 'json',
		url: 'https://api.github.com/repos/altbdoor/utar-accommodation-list/git/refs/heads/travis_data',
		success: function (data) {
			var commit = data.object.sha;
			
			cdnPath = '//cdn.rawgit.com/altbdoor/utar-accommodation-list/' + commit + '/';
			$(campus).removeAttr('disabled').trigger('change');
			
			$.getJSON('https://api.github.com/repos/altbdoor/utar-accommodation-list/git/commits/' + commit, function (dataJ) {
				var time = Date.parse(dataJ.author.date),
					date = new Date(time);
				
				$('#commit-time').text(date.toUTCString());
			});
		}
	});
	
	$(campus).on('change', function () {
		var campusVal = $(this).val();
		
		$(results).empty();
		updateResultCount();
		
		if (campusVal) {
			$.getJSON(cdnPath + campusVal + '.json', function (data) {
				var resultsHtml = '';
				
				for (var key in data) {
					for (var i=0; i<data[key].length; i++) {
						var currentData = data[key][i],
							currentTemplate = template.slice(0),
							
							priceList = currentData['price'].slice(0).sort();
						
						currentData['type'] = key.toLowerCase().replace('/', '_');
						currentData['googleMapLink'] = encodeURIComponent(currentData['address']);
						
						currentData['dataPriceMin'] = priceList[0];
						currentData['dataPriceMax'] = priceList[priceList.length - 1];
						
						if (currentData['office'].length != 0) {
							currentData['office'] = $.map(currentData['office'], function (item) {
								return '<a href="tel:+6' + item + '">' + item + '</a>';
							}).join('<br>');
						}
						else {
							currentData['office'] = 'N/A';
						}
						
						if (currentData['mobile'].length != 0) {
							currentData['mobile'] = $.map(currentData['mobile'], function (item) {
								return '<a href="tel:+6' + item + '">' + item + '</a>';
							}).join('<br>');
						}
						else {
							currentData['mobile'] = 'N/A';
						}
						
						if (currentData['email'] != 'N/A') {
							currentData['email'] = '<a href="mailto:' + currentData['email'] + '">' + currentData['email'] + '</a>';
						}
						
						currentData['info'] = '<li>' + currentData['info'].join('</li><li>') + '</li>';
						
						if (currentData['size'].length >= 1) {
							var priceText = [];
							
							for (var j=0; j<currentData['size'].length; j++) {
								priceText.push([
									'<span class="label label-' + currentData['size'][j].toLowerCase() + '">' +
									currentData['size'][j] +
									', RM ' + currentData['price'][j] + ', ' +
									currentData['count'][j] + 'P' +
									'</span>'
								]);
							}
							
							currentData['price'] = priceText.reverse().join(' ');
						}
						else {
							currentData['price'] = '<span class="label label-default">RM ' + currentData['price'][0] + '</span>';
						}
						
						currentData['remark'] = '<li>' + currentData['remark'].join('</li><li>') + '</li>';
						
						for (var dataKey in currentData) {
							currentTemplate = currentTemplate.replace(
								'{{ ' + dataKey + ' }}',
								currentData[dataKey]
							);
						}
						
						resultsHtml += currentTemplate;
					}
				}
				
				$(results).html(resultsHtml);
				$(filterPriceMin).trigger('change');
			});
			
		}
	});
	
	$('#generator-form').on('change keyup', 'input', function () {
		var typeList = [],
			
			priceMin = $(filterPriceMin).val(),
			priceMax = $(filterPriceMax).val(),
			
			filterAddressVal = $(filterAddress).val(),
			addressRegex = null;
		
		$(filterType).each(function (index, item) {
			if ($(item).is(':checked')) {
				typeList.push($(item).val());
			}
		});
		
		if (/\d+/.test(priceMin)) {
			priceMin = +(priceMin)
		}
		else {
			priceMin = 0;
		}
		
		if (/\d+/.test(priceMax)) {
			priceMax = +(priceMax)
		}
		else {
			priceMax = 0;
		}
		
		if (priceMin > priceMax) {
			priceMin = priceMax = 0;
		}
		
		if (filterAddressVal != '') {
			addressRegex = new RegExp(filterAddressVal, 'i');
		}
		
		$(results).children().each(function (index, item) {
			var itemType = $(item).data('type'),
				itemPriceMin = $(item).data('price-min'),
				itemPriceMax = $(item).data('price-max'),
				itemAddress = $(item).find('.panel-address').first().text(),
				
				isTypeAllowed = true,
				isPriceAllowed = true,
				isAddressAllowed = true;
			
			isTypeAllowed = ($.inArray(itemType, typeList) !== -1);
			
			if (priceMin == 0 && priceMax == 0) {
				isPriceAllowed = true;
			}
			else {
				isPriceAllowed = (
					itemPriceMin >= priceMin &&
					itemPriceMax <= priceMax
				);
			}
			
			if (addressRegex != null) {
				isAddressAllowed = addressRegex.test(itemAddress);
			}
			
			if (isTypeAllowed && isPriceAllowed && isAddressAllowed) {
				$(item).removeClass('hide');
			}
			else {
				$(item).addClass('hide');
			}
		});
		
		updateResultCount();
	});
	
	$(results).on('click', '.panel-heading', function () {
		$(this).siblings('.panel-collapse').first().toggleClass('in');
	});
	
	$('#results-toggle-all').on('click', function () {
		var mode = $(this).data('mode'),
			target = $(results).find('.panel-collapse');
		
		if (mode == 0) {
			$(target).addClass('in');
		}
		else {
			$(target).removeClass('in');
		}
		
		$(this).data('mode', (mode + 1) % 2);
	});
	
	function updateResultCount () {
		$('#result-count').text(
			$(results).children(':not(.hide)').length
		);
	}
})(document, window);
