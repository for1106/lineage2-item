var crawler = require('crawler');
var _ = require('lodash');
var url = require('url');
var querystring = require('querystring');
var fs = require('fs');

var base = 'http://gametsg.techbang.com/lineage2/';
var item = {};
var list = {};

step1();

function step1(){
	var c = new crawler({
		maxConnections : 1,
		forceUTF8: true,
		onDrain:step2
	});

	c.queue({
		uri:url.resolve(base,'index.php?view=item'),
		callback:function(error,result,$){
			if(error){
				return console.log(error);
			}

			$('.db_menu2 a').each(function(){
				var text = $(this).text().trim();
				var href = $(this).attr('href');
				var query = querystring.parse(url.parse(href).query);

				if(
					1
					&& (query.k2 == '武器' || query.k2 == '防具')
					// && _.indexOf(['頭盔'],query.k3) != -1
				){
					item[text] = href;
				}
			});
		}
	});
}

function step2(){
	var c = new crawler({
		maxConnections : 10,
		forceUTF8: true,
		onDrain:step3
	});

	_.each(item,function(v,k){
		c.queue({
			uri:url.resolve(base,v),
			callback:function(error,result,$){
				if(error){
					return console.log(error);
				}

				var temp = {};
				$('.layout_left .gray_top').each(function(){
					var a = $(this).find('a');
					var text = a.text().trim();
					var href = a.attr('href');

					//是否可製作
					if($(this).find('.color12').length){
						temp[text] = true;
						if(
							1
							// && text == '全覆式頭盔'
						){
							list[text] = href;
						}
					}else{
						temp[text] = false;
					}
				});

				item[k] = temp;
			}
		});
	});
}

function step3(){
	for(var x in list){
		if(_.isString(list[x])){
			console.log(x);
			return step4(x);
		}
	}

	done();
}

function step4(k){
	var c = new crawler({
		maxConnections : 1,
		forceUTF8: true,
		onDrain:step3
	});

	c.queue({
		uri:url.resolve(base,list[k]),
		callback:function(error,result,$){
			if(error){
				return console.log(error);
			}

			var temp = {};
			var temp_num = 1;

			var classic = $('.layout_left td.h20.big2.color10');
			if(classic.length && classic.text().trim() == '(經典伺服器) 製作樹狀圖'){
				classic.parents('div')
				.find('td.mid1').each(function(){
					var a = $(this).find('a');
					var text = a.text().trim();
					var href = a.attr('href');
					var num = parseInt($(this).find('#material_num_classic_1').text().trim());

					temp[text] = num;

					if(!list[text]){
						if(text.indexOf('製作卷軸') == -1){
							list[text] = href;
						}else{
							list[text] = [{},1];
						}
					}
				}).end()
				.find('span.mid1').each(function(){
					if($(this).find('a.color18.mid1').length){
						var num = $(this).text();
						num = num.split('x');
						temp_num = parseInt(num[1].trim());
					}
				});
			}

			list[k] = [temp,temp_num];
		}
	});
}

function done(){
	console.log(item);
	console.log(list);

	fs.writeFile('www/json/item.json',JSON.stringify(item),function(error){
		if(error){
			return console.log(error);
		}
	});

	fs.writeFile('www/json/list.json',JSON.stringify(list),function(error){
		if(error){
			return console.log(error);
		}
	});
}