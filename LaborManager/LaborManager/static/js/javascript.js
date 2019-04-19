Array.prototype.remove = function() {
    var what, a = arguments, L = a.length, ax;
    while (L && this.length) {
        what = a[--L];
        while ((ax = this.indexOf(what)) !== -1) {
            this.splice(ax, 1);
        }
    }
    return this;
};

var app = angular.module('CocktailGenerator', ['ngDragDrop', 'ui.bootstrap', 'ui.bootstrap.tpls', 'angular.filter']);
app.controller('ctrl', function($scope, $http, $window, $uibModal) {
	
	var googleSearchQuery = [];
	var googleSearchRunning = false;
	var searchApiKey = ["AIzaSyCrgc0RkX0vCp0fn3xXUXhZNVIMoMsE7cE","AIzaSyBWuFLTxyKMZRUeOPy1hNGoF9c6omexOiU", "AIzaSyDqz8m4Dh650h15AfAjS5-3h9mPvwbR1g8"];
	var activeKey = 0;
	var searchEngineKey = "014090161208838272566:yo88wwdmo1m";
	var imageRequestRetries = 0;
	var valueChanging = false;
	var connection = null;
	var splitsReady = false;
	if(location.hostname){
		connection = new WebSocket('ws://'+location.hostname+':81/', ['arduino']);
		connection.onopen = function(){
			connection.send('Connect ' + new Date()); 
		};
		connection.onerror = function(error){
			console.log('WebSocket Error ', error);
		};
		connection.onmessage = function(e){
			console.log('Server: ', e.data);
		};
	}

	$scope.admin = {pass: "8272", enter: ""};
	$scope.progress = 0;
	$scope.searchRunning = false;
	$scope.endAt = 20000;
	$scope.splits = {};
	
	$scope.origins = [{
		name: "Getränk 1",
		list: []
	},{
		name: "Getränk 2",
		list: []
	},{
		name: "Getränk 3",
		list: []
	},{
		name: "Getränk 4",
		list: []
	},{
		name: "Getränk 5",
		list: []
	},{
		name: "Getränk 6",
		list: []
	},{
		name: "Getränk 7",
		list: []
	},{
		name: "Getränk 8",
		list: []
	},{
		name: "Getränk 9",
		list: []
	},{
		name: "Getränk 10",
		list: []
	},{
		name: "Getränk 11",
		list: []
	},{
		name: "Getränk 12",
		list: []
	},{
		name: "Getränk 13",
		list: []
	},{
		name: "Getränk 14",
		list: []
	},{
		name: "Getränk 15",
		list: []
	},{
		name: "Getränk 16",
		list: []
	},{
		name: "Optionale Zugabe",
		list: []
	}];
	
	if(!$window.localStorage.getItem("ingredients")){
		$http.get("https://www.thecocktaildb.com/api/json/v1/1/list.php?i=list").then(function(response) {
			$scope.ingredients = response.data.drinks;
			$window.localStorage.setItem("ingredients", JSON.stringify($scope.ingredients));
		});
	} else {
		$scope.ingredients = angular.fromJson($window.localStorage.getItem("ingredients"));
	}
	
	$scope.maxAlcAmount = 20;
	if($window.localStorage.getItem("maxAlcAmount")){
		$scope.maxAlcAmount = angular.fromJson($window.localStorage.getItem("maxAlcAmount"));
	}
	$scope.$watch('maxAlcAmount', function() {
		$window.localStorage.setItem("maxAlcAmount", JSON.stringify($scope.maxAlcAmount));	
	}, true);

	$scope.maxAmount = 200;
	if($window.localStorage.getItem("maxAmount")){
		$scope.maxAmount = angular.fromJson($window.localStorage.getItem("maxAmount"));
	}
	$scope.$watch('maxAmount', function() {
		$window.localStorage.setItem("maxAmount", JSON.stringify($scope.maxAmount));	
	}, true);
	
	$scope.lastId = 11000;
	if($window.localStorage.getItem("lastId")){
		$scope.lastId = angular.fromJson($window.localStorage.getItem("lastId"));
	}
	$scope.$watch('lastId', function() {
		$window.localStorage.setItem("lastId", JSON.stringify($scope.lastId));	
	}, true);
	
	if($window.localStorage.getItem('origins')){
		$scope.origins = angular.fromJson($window.localStorage.getItem('origins'));
	}
	$scope.$watch("origins", function(a,b,c) {
		$window.localStorage.setItem('origins', JSON.stringify($scope.origins));
	}, true);
	
	$scope.selectedIngredients = [];
	if($window.localStorage.getItem("selectedIngredients")){
		$scope.selectedIngredients = angular.fromJson($window.localStorage.getItem("selectedIngredients"));
	}
	$scope.$watch('selectedIngredients', function() {
		$window.localStorage.setItem("selectedIngredients", JSON.stringify($scope.selectedIngredients));	
	}, true);
	
	$scope.cocktails = [];
	if($window.localStorage.getItem("cocktails")){
		$scope.cocktails = angular.fromJson($window.localStorage.getItem("cocktails"));
	}
	$scope.$watch('cocktails', function() {
		$window.localStorage.setItem('cocktails', JSON.stringify($scope.cocktails));
	}, true);
	
	$scope.externalImages = {};
	if($window.localStorage.getItem("externalImages")){
		$scope.externalImages = angular.fromJson($window.localStorage.getItem("externalImages"));
	}
	$scope.$watch('externalImages', function() {
		$window.localStorage.setItem('externalImages', JSON.stringify($scope.externalImages));
	}, true);
	
	var setMissingIngredients = function(cocktail, selectedIngredients){
		cocktail.missingIngredients = [];
		cocktail.missingIngredientsCount = 0;
		for(var i2 = 1; i2<=15; i2++){
			var ingredient = cocktail["strIngredient"+i2];
			if(ingredient && selectedIngredients.indexOf(ingredient) === -1){
				cocktail.missingIngredients.push(cocktail["strIngredient"+i2]);
				cocktail.missingIngredientsCount++;
			}
		}
		return cocktail;
	}
	
	$scope.getCocktails = function(){
		var allIngredients = [];
		var selectedIngredients = [];
		if($scope.ingredients){
			for (var i = 0, len = $scope.ingredients.length; i < len; i++) {
				allIngredients.push($scope.ingredients[i].strIngredient1);
				if($scope.ingredients[i].selected){
					selectedIngredients.push($scope.ingredients[i].strIngredient1);
				}
			}
		}
		for(var i=$scope.cocktails.length-1; i>=0; i--){
			setMissingIngredients($scope.cocktails[i], selectedIngredients);
		}
		if(!$scope.searchRunning){
			var startAt = $scope.lastId+1;
			var seachCocktail = function(id){
				$scope.searchRunning = true;
				$http.get("https://www.thecocktaildb.com/api/json/v1/1/lookup.php?i="+id).then(function(response) {
					if(response.data.drinks){
						var cocktail = response.data.drinks[0];
						setMissingIngredients(cocktail, selectedIngredients);
						$scope.cocktails.push(cocktail);
					}
					$scope.lastId = id;
					$scope.progress = (id-startAt)/($scope.endAt-startAt)*100;
					if(id<$scope.endAt){
						seachCocktail(++id);
					} else {
						$scope.progress = 0;
						$scope.searchRunning = false;
					}
				}, function(error){
					$scope.searchRunning = false;
				});
			}
			if(startAt<=$scope.endAt){
				seachCocktail(startAt)
			}
		}
	}

	$scope.setFavourite = function(cocktail){
		cocktail.favourite = !cocktail.favourite;
	}
	
	$scope.resetCocktails = function(){
		$scope.lastId = 0;
		$scope.cocktails = [];
	}
	
	$scope.countSplit = function(name,count, last){
		if(!splitsReady){
			$scope.splits[name] = ($scope.splits[name]+count) || (count-1);
			if(last){
				splitsReady = true;
			}
		}
	}
	
	$scope.splitIngredient = function(origin, ingredient){
		if(!$scope.splits[ingredient.strIngredient1]||$scope.splits[ingredient.strIngredient1]<=16){
			$scope.splits[ingredient.strIngredient1] = $scope.splits[ingredient.strIngredient1] ? $scope.splits[ingredient.strIngredient1]+1 : 1;
			origin.push(angular.copy(ingredient));
		}
	}
	
	$scope.removeSplit = function(origin, ingredientName){
		if($scope.splits[ingredientName]){
			for(var i = 0; i < origin.length; i++){
				if(origin[i].strIngredient1 == ingredientName){
					origin.remove(origin[i]);
					break;
				}
			}
			$scope.splits[ingredientName] -= 1;
		}
	}
	
	$scope.newOrigin = function(){
		$scope.origins.push({name: 'Getränk '+($scope.origins.length+1), list: []});
	}
	
	$scope.deleteOrigins = function(){
		for(var i = $scope.origins.length-1; i >= 0; i--){
			if(!$scope.origins[i].list.length){
				$scope.origins.remove($scope.origins[i]);
			}
		}
	}

	$scope.changeValue = function(object, value, description, defaultValue, inputType, callback){
		if(!valueChanging){
			valueChanging = true;
			var modalInstance = $uibModal.open({
			  animation: true,
			  ariaLabelledBy: 'modal-title',
			  ariaDescribedBy: 'modal-body',
			  templateUrl: 'changeText.html',
			  controller: 'changeValueCtrl',
			  controllerAs: '$ctrl',
			  resolve: {
				description: function () {
				  return description;
				},
				value: function () {
					return object[value];
				},
				inputType: function(){
					return inputType||'text';
				}
			  }
			});
			modalInstance.result.then(function (newValue) {
				object[value] = newValue||defaultValue;
				if(typeof callback == "function") callback(newValue);
				valueChanging = false;
			}, function () {
				valueChanging = false;
			});
		}
	}
	
	$scope.getGoogleImage = function(cocktailName){
		if($scope.externalImages[cocktailName]){
			return $scope.externalImages[cocktailName];
		} else {
			if(googleSearchQuery.indexOf(cocktailName)==-1){
				if(!googleSearchRunning){
					googleSearchRunning = true;
					$http.get("https://www.googleapis.com/customsearch/v1?key="+searchApiKey[activeKey]+"&cx="+searchEngineKey+"&q="+encodeURI(cocktailName.replace("#","")+" +cocktail")+"&searchType=image&fileType=jpg&imgSize=medium&alt=json").then(function(response) {
						if(response.data.items.length>0){
							$scope.externalImages[cocktailName]=response.data.items[0].link.indexOf('.jpg')?response.data.items[0].link:response.data.items[0].image.thumbnailLink;
						} 
						googleSearchRunning = false;
						console.log("finish search "+cocktailName, $scope.externalImages[cocktailName]);
						googleSearchQuery.remove(cocktailName);
						if(googleSearchQuery.length>0){
							$scope.getGoogleImage(googleSearchQuery.shift());
						}
					}, function(){
						if(imageRequestRetries<5){
							imageRequestRetries++;
							activeKey++;
							if(activeKey>searchApiKey.length-1){
								activeKey=0;
							}
							googleSearchRunning = false;
							googleSearchQuery.remove(cocktailName);
							$scope.getGoogleImage(googleSearchQuery[0]);
							
						}
					});
				} else {
					googleSearchQuery.push(cocktailName);
				}
			}
		}
	}
	
	$scope.openCocktailDetails = function (cocktail) {
		var modalInstance = $uibModal.open({
		  animation: true,
		  ariaLabelledBy: 'modal-title',
		  ariaDescribedBy: 'modal-body',
		  templateUrl: 'cocktailDetails.html',
		  controller: 'CocktailDetailsCtrl',
		  controllerAs: '$ctrl',
		  size: 'lg',
		  resolve: {
			cocktail: function () {
			  return cocktail;
			},
			selectedIngredients: function () {
				var selectedIngredients = [];
				if($scope.ingredients){
					for (var i = 0, len = $scope.ingredients.length; i < len; i++) {
						if($scope.ingredients[i].selected){
							selectedIngredients.push($scope.ingredients[i].strIngredient1);
						}
					}
				}
				return selectedIngredients;
			},
			origins: function(){ return $scope.origins; },
			splits: function(){ return $scope.splits; },
			maxAlcAmount: function(){ return $scope.maxAlcAmount; },
			maxAmount: function(){ return $scope.maxAmount; },
			imageSrc: function(){ return cocktail.strDrinkThumb||$scope.externalImages[cocktail.strDrink] },
			connection: function(){ return connection; }
		  }
		});
		modalInstance.result.then(function () {
		}, function () {
		});
	};

	$scope.test = function(){
		if(connection){
			connection.send("m011021"); 
			connection.onmessage = function(e){
				console.log('Status: ', e.data);
				$scope.status = parseInt(e.data);
				$scope.$apply();
			};
		}
	};
	
	$scope.select = function(ingredient){
		ingredient.selected = !ingredient.selected;
		if(ingredient.selected){
			$scope.selectedIngredients.push(ingredient);
		} else {
			for (var i = $scope.selectedIngredients.length-1; i >= 0; i--) {
				if($scope.selectedIngredients[i].strIngredient1 == ingredient.strIngredient1){
					$scope.selectedIngredients.splice(i, 1);
				}
			}
			for (var i = $scope.origins.length-1; i >= 0; i--) {
				for (var i2 = $scope.origins[i].list.length-1; i2 >= 0; i2--) {
					if($scope.origins[i].list[i2] && $scope.origins[i].list[i2].strIngredient1 == ingredient.strIngredient1){
						$scope.origins[i].list.remove($scope.origins[i].list[i2]);
					}
				}
			}
			$scope.splits[ingredient.strIngredient1] = 0;
		}
		$window.localStorage.setItem("ingredients", JSON.stringify($scope.ingredients));	
		$scope.getCocktails();
	}
})
.controller('changeValueCtrl', function ($uibModalInstance, description, value, inputType) {
  var $ctrl = this;

  $ctrl.description = description;
  $ctrl.value = value;
  $ctrl.inputType = inputType;
  $ctrl.ok = function () {
    $uibModalInstance.close($ctrl.value);
  };

  $ctrl.cancel = function () {
    $uibModalInstance.dismiss('cancel');
  };
})
.controller('CocktailDetailsCtrl', function ($scope, $uibModalInstance, $window, cocktail, selectedIngredients, origins, splits, maxAlcAmount, maxAmount, imageSrc, connection) {
	
	var noAmountCount = 0;
	var units = {
	  'splash': 4,
	  'tblsp': 11,
	  'tsp': 4,
	  'oz': 30,
	  'dash': 1,
	  'shot': 45,
	  'part': maxAmount,
	  'parts': maxAmount,
	  'bottle': maxAmount,
	  'juice': 50,
	  'pint': 473,
	  'drops': 0.1,
	  'squeeze': 1,
	  'cl': 10,
	  'ml': 1,
	  'wedge': 50/4,
	  'slice': 50/4,
	  'gr': 1,
	  'l': 1000,
	  'gal': 3785,
	  'lb': 453,
	  'dl': 100
	};

	$scope.cocktail = cocktail;
	$scope.cocktail.makes = $scope.cocktail.makes || 0;
	$scope.alcoholAmount = 0;
	$scope.totalAmount = 0;
	$scope.process = {};
	$scope.ventils = {};
	$scope.ingredientName = {};
	$scope.ingredients = [];
	$scope.imageSrc = imageSrc;
	$scope.status = -1;
	
	for(var ingredientIndex = 1; ingredientIndex<=15; ingredientIndex++){
		if($scope.cocktail["strIngredient"+ingredientIndex]){
			var ingredient = $scope.cocktail["strIngredient"+ingredientIndex];
			var additional = false;
			var amountSplit = $scope.cocktail["strMeasure"+ingredientIndex].split(" ");
			var amount = 0;
			var unit = 0;			
			for(var i = 0; i<amountSplit.length; i++){
				if(amountSplit[i]){
					amountSplit[i].replace(',','.');
					if(amountSplit[i].indexOf('\/')==-1 && parseInt(amountSplit[i])>0){
						amount += parseFloat(amountSplit[i]);
					} else {
						if(amountSplit[i].indexOf('\/')!==-1){
							var valueSplit = amountSplit[i].split('\/');
							amount += parseInt(valueSplit[0])/parseInt(valueSplit[1]);
						} else {
							if(units[amountSplit[i].toLowerCase()]){
								unit = units[amountSplit[i].toLowerCase()];
							} else {
								console.log('Unknown Unit/Amount: '+amountSplit[i])
							}
						}
					}
				}
			}		
			for (var i = origins.length-1; i>=0; i--) {
				var percent = origins[i].name.match(/[0-9]+%/)?parseInt(origins[i].name.match(/[0-9]+%/)[0]):0;
				for (var i2 = 0, len2 = origins[i].list.length; i2 < len2; i2++) {
					if(origins[i].list[i2] && origins[i].list[i2].strIngredient1 == ingredient){
						if(origins[i].name.toLowerCase().indexOf("optional")==-1){
							$scope.ventils[origins[i].name] = i+1;
							if(unit||amount){
								var splitAmount = ((amount||1)*(unit||(amount<1?maxAmount:units['oz'])))/(1+(splits[ingredient]||0));
								$scope.alcoholAmount += (splitAmount/100)*percent;
								$scope.process[origins[i].name] = $scope.process[origins[i].name] || 0;
								$scope.process[origins[i].name] += splitAmount;
								$scope.totalAmount += splitAmount;
							} else {
								$scope.process[origins[i].name] = -1;
								noAmountCount++;
							}
							$scope.ingredientName[origins[i].name] = ingredient;
						} else {
							additional = true;
						}
					}
				}
			}
			$scope.ingredients.push({
				missing: (selectedIngredients.indexOf(ingredient) === -1),
				originalAmount: $scope.cocktail["strMeasure"+ingredientIndex],
				name: ingredient,
				additional: additional
			});
		}		
	}

	var maxAlcPercent = $scope.cocktail.strAlcoholic!='Alcoholic'?1:maxAlcAmount/(maxAmount/100);
	if(noAmountCount>0){
		$scope.alcoholPercent = $scope.alcoholAmount/($scope.totalAmount/100);
		var addAmount = 0;
		var addAlc = 0;
		for(var name in $scope.process){
			if($scope.process[name]==-1){
				if($scope.alcoholPercent>maxAlcPercent || $scope.totalAmount<maxAmount){
					var percent = name.match(/[0-9]+%/)?parseInt(name.match(/[0-9]+%/)[0]):0;
					$scope.process[name] = ($scope.alcoholPercent>maxAlcPercent) ? ((($scope.alcoholAmount/maxAlcPercent)*100)-$scope.totalAmount)/noAmountCount : (maxAmount-$scope.totalAmount)/noAmountCount;
					addAmount += $scope.process[name];
					addAlc += ($scope.process[name]/100)*percent
				}
			}
		}
		$scope.totalAmount += addAmount;
		$scope.alcoholAmount += addAlc;
	}

	if($scope.alcoholAmount>maxAlcAmount||$scope.totalAmount>maxAmount){
		var factor = (maxAlcAmount/$scope.alcoholAmount)<(maxAmount/$scope.totalAmount)?(maxAlcAmount/$scope.alcoholAmount):(maxAmount/$scope.totalAmount);
		for(var name in $scope.process){
			$scope.process[name] *= factor;
		}
		$scope.totalAmount *= factor;
		$scope.alcoholAmount *= factor;
	}

	$scope.alcoholPercent = $scope.alcoholAmount/($scope.totalAmount/100);
	
	$scope.ok = function () {
		var array  = [];
		var order = "m";
		for(var ingredient in $scope.process){
			array.push([ingredient, Math.round($scope.process[ingredient])]);
		}
		array.sort(function(a,b){return a[1] - b[1]});
		for(var i=0;i<array.length;i++){
			order += ('0' + $scope.ventils[array[i][0]]).slice(-2)+('00' + array[i][1]).slice(-3);
		}
		if(connection){
			connection.send(order); 
			connection.onmessage = function(e){
				console.log('Status: ', e.data);
				$scope.status = parseInt(e.data);
				if($scope.status == 100){
					$scope.cancel();
				}
				$scope.$apply();
			};
		}
		console.log("Send "+order);
		$scope.cocktail.makes++;
	};

	$scope.cancel = function () {
		$uibModalInstance.dismiss('cancel');
	};
})
.directive('sglclick', ['$parse', function($parse) {
    return {
        restrict: 'A',
        link: function(scope, element, attr) {
          var fn = $parse(attr['sglclick']);
          var delay = 300, clicks = 0, timer = null;
          element.on('click', function (event) {
            clicks++;  //count clicks
            if(clicks === 1) {
              timer = setTimeout(function() {
                scope.$apply(function () {
                    fn(scope, { $event: event });
                }); 
                clicks = 0;             //after action performed, reset counter
              }, delay);
              } else {
                clearTimeout(timer);    //prevent single-click action
                clicks = 0;             //after action performed, reset counter
              }
          });
        }
    };
}])
.directive('touchDblclick', function () {
	const DblClickInterval = 300; //milliseconds
	var firstClickTime;
	var waitingSecondClick = false;
	return {
		restrict: 'A',
		link: function (scope, element, attrs) {
			element.bind('click', function (e) {
				if (!waitingSecondClick) {
					firstClickTime = (new Date()).getTime();
					waitingSecondClick = true;

					setTimeout(function () {
						waitingSecondClick = false;
					}, DblClickInterval);
				}
				else {
					waitingSecondClick = false;

					var time = (new Date()).getTime();
					if (time - firstClickTime < DblClickInterval) {
						scope.$apply(attrs.touchDblclick);
					}
				}
			});
		}
	};
});
