function MainAssistant() {}

MainAssistant.prototype.setup = function() {

	this.doUpdateCheck();

/*	// create the drop-down menu
	this.appMenuModel = this.controller.setupWidget(Mojo.Menu.appMenu,
							{omitDefaultItems: true},

							{
								visible: true,
								items: [
							    		{ label: "About", command: 'menu-about' }
								]
							});
*/


	// enable fullscreen mode
	this.controller.enableFullScreenMode(true);

	// set up spinner widget
	this.controller.setupWidget("spinny",
		{spinnerSize: "small"},
		this.spinnerModel = {spinning: false}
	);

	// initially show hottest apps, free apps
	this.curCat = 0;
	this.curCost = 0;
	this.doAjax(this.curCat,this.curCost);

	this.rankHTML = "";

	// reference for cleanup
	this.handleTap = this.handleTap.bind(this);

	// event listeners
	Mojo.Event.listen(this.controller.get("hottestApps"), Mojo.Event.tap, this.handleTap);
	Mojo.Event.listen(this.controller.get("fastestMovs"), Mojo.Event.tap, this.handleTap);
	Mojo.Event.listen(this.controller.get("freeApps"), Mojo.Event.tap, this.handleTap);
	Mojo.Event.listen(this.controller.get("paidApps"), Mojo.Event.tap, this.handleTap);

}


MainAssistant.prototype.handleTap = function(event) {

	switch (event.target.id) {

		case "hottestApps":
			this.curCat = 0;
			// move selected underline bar underneath hottest apps
			this.controller.get("selection").style.left = "0px";
		break;

		case "fastestMovs":
			this.curCat = 1;
			// move selected underline bar underneath fastest movers
			this.controller.get("selection").style.left = "160px";
		break;

		case "freeApps":
			this.curCost = 0;
			// show selected box around free icon and remove it from paid, if necessary
			this.controller.get("freeApps").className = "cost-selected";
			this.controller.get("paidApps").className = "cost-not-selected";
		break;

		case "paidApps":
			this.curCost = 1;
			// show selected box around paid icon and remove it from free, if necessary
			this.controller.get("paidApps").className = "cost-selected";
			this.controller.get("freeApps").className = "cost-not-selected";
		break;

	}

	this.doAjax(this.curCat,this.curCost);

}



MainAssistant.prototype.doAjax = function(category, cost) {

	// set variables to retain data
	this.curCat = category;
	this.curCost = cost;
/*				this.controller.showAlertDialog({
					title: $L("Success"),
					message: $L("Setting spinner"),
					choices:[
	         				{label:$L('Ok'), value:"refresh", type:'affirmative'}
					]				    
				});
*/
	// set spinner on
	this.spinnerModel.spinning = true;
	this.controller.modelChanged(this.spinnerModel);

/*				this.controller.showAlertDialog({
					title: $L("Success"),
					message: $L("Spinner set"),
					choices:[
	         				{label:$L('Ok'), value:"refresh", type:'affirmative'}
					]				    
				});
*/
	// if we're getting hottest apps
	if (category == 0) {
		// url to Palm JSON data
		var url = "http://palmhotapps.com/RankingData";
	}

	// fastest movers
	else {
		// url to Palm JSON data
		var url = "http://palmhotapps.com/FastMoverData";
	}

	// do AJAX request
	var request = new Ajax.Request(url, {
		method: 'get',
		evalJSON: 'force',
		onSuccess: this.showResults.bind(this,category,cost),
		onFailure: this.failure.bind(this)
	});

}

MainAssistant.prototype.showResults = function(category, cost, transport) {

/*				this.controller.showAlertDialog({
					title: $L("Success"),
					message: $L("Success"),
					choices:[
	         				{label:$L('Ok'), value:"refresh", type:'affirmative'}
					]				    
				});
*/
	var r = transport.responseJSON;

	// showing hottest apps
	if (category == 0) {

		// iterate through data
		for(var i=0; i < 221; i++) {

			// so we display starting with #1 instead of 0
			var ref = i+1;

			// set the prize amounts
			if (ref == 1) {
				var prize = "$100,000";
			}
			else if ( (ref > 1) && (ref < 22) ) {
				var prize = "$10,000";
			}
			else {
				var prize = "$1,000";
			}

			var arrowToday = "none";
			var arrowWeek = "none";

			this.getRankingHTML(ref);

			// showing free apps
			if (cost == 0) {

				var todayMovement = parseInt(r.apps.free[i].movementdaily);
					if (todayMovement < 0) {
						todayMovement = todayMovement * -1;
						arrowToday = "down";
					}
					else if (todayMovement > 0) {
						arrowToday = "up";
					}

				var weekMovement = parseInt(r.apps.free[i].movementweekly);
					if (weekMovement < 0) {
						weekMovement = weekMovement * -1;
						arrowWeek = "down";
					}
					else if (weekMovement > 0) {
						arrowWeek = "up";
					}

				this.controller.get(ref.toString()).innerHTML = 
'<div class="listItem">' +

'<div class="appTitle"><a href="http://developer.palm.com/appredirect/?packageid=' + r.apps.free[i].id + '">' + r.apps.free[i].title + '</a></div>' +

'<div class="row2">' +

'<div class="iconImg"><a href="http://developer.palm.com/appredirect/?packageid=' + r.apps.free[i].id + '"><img src="' + r.apps.free[i].icon1 + '" width=32 height=32 /></a></div>' +

'<div class="movements">' +
'<div class="dailyRow">' +
'<div class="todayLabel">Daily</div>' +
'<div class="todayArrow ' + arrowToday + '"></div>' +
'<div class="todayMovement">' + todayMovement + '</div>' +
'</div>' +

'<div class="weeklyRow">' +
'<div class="weekLabel">Week</div>' +
'<div class="weekArrow ' + arrowWeek + '"></div>' +
'<div class="weekMovement">' + weekMovement + '</div>' +
'</div>' +
'</div>' +

'<div class="appPrize">' + prize  + '</div>' +

'<div class="appRank">' + this.rankHTML + '</div>' +
'</div>' +

'</div>';
			}
	
			// paid apps
			else {

				var todayMovement = parseInt(r.apps.paid[i].movementdaily);
					if (todayMovement < 0) {
						todayMovement = todayMovement * -1;
						arrowToday = "down";
					}
					else if (todayMovement > 0) {
						arrowToday = "up";
					}

				var weekMovement = parseInt(r.apps.paid[i].movementweekly);
					if (weekMovement < 0) {
						weekMovement = weekMovement * -1;
						arrowWeek = "down";
					}
					else if (weekMovement > 0) {
						arrowWeek = "up";
					}

				this.controller.get(ref.toString()).innerHTML = 
'<div class="listItem">' +

'<div class="appTitle"><a href="http://developer.palm.com/appredirect/?packageid=' + r.apps.paid[i].id + '">' + r.apps.paid[i].title + '</a></div>' +

'<div class="row2">' +

'<div class="iconImg"><a href="http://developer.palm.com/appredirect/?packageid=' + r.apps.paid[i].id + '"><img src="' + r.apps.paid[i].icon1 + '" width=32 height=32 /></a></div>' +

'<div class="movements">' +
'<div class="dailyRow">' +
'<div class="todayLabel">Daily</div>' +
'<div class="todayArrow ' + arrowToday + '"></div>' +
'<div class="todayMovement">' + todayMovement + '</div>' +
'</div>' +

'<div class="weeklyRow">' +
'<div class="weekLabel">Week</div>' +
'<div class="weekArrow ' + arrowWeek + '"></div>' +
'<div class="weekMovement">' + weekMovement + '</div>' +
'</div>' +
'</div>' +

'<div class="appPrize">' + prize  + '</div>' +

'<div class="appRank">' + this.rankHTML + '</div>' +
'</div>' +

'</div>';
			}
		}
	}









	// or fastest movers
	else {

		// there are 221 divs to make room for the hottest apps, so clear out divs 51-221 for fastest movers data
		for(var i=51; i < 222; i++) {
			this.controller.get(i.toString()).innerHTML = "";
		}

		// iterate through data
		for(var i=0; i < 50; i++) {

			// so we display starting with #1 instead of 0
			var ref = i+1;

			// don't display prize amounts for fastest movers
			var prize = "";

			var arrowToday = "none";
			var arrowWeek = "none";

			this.getRankingHTML(ref);

			// showing free apps
			if (cost == 0) {

				var todayMovement = parseInt(r.apps.free[i].movementdaily);
					if (todayMovement < 0) {
						todayMovement = todayMovement * -1;
						arrowToday = "down";
					}
					else if (todayMovement > 0) {
						arrowToday = "up";
					}

				var weekMovement = parseInt(r.apps.free[i].movementweekly);
					if (weekMovement < 0) {
						weekMovement = weekMovement * -1;
						arrowWeek = "down";
					}
					else if (weekMovement > 0) {
						arrowWeek = "up";
					}


				this.controller.get(ref.toString()).innerHTML = 
'<div class="listItem">' +

'<div class="appTitle"><a href="http://developer.palm.com/appredirect/?packageid=' + r.apps.free[i].id + '">' + r.apps.free[i].title + '</a></div>' +

'<div class="row2">' +

'<div class="iconImg"><a href="http://developer.palm.com/appredirect/?packageid=' + r.apps.free[i].id + '"><img src="' + r.apps.free[i].icon1 + '" width=32 height=32 /></a></div>' +

'<div class="movements">' +
'<div class="dailyRow">' +
'<div class="todayLabel">Daily</div>' +
'<div class="todayArrow ' + arrowToday + '"></div>' +
'<div class="todayMovement">' + todayMovement + '</div>' +
'</div>' +

'<div class="weeklyRow">' +
'<div class="weekLabel">Week</div>' +
'<div class="weekArrow ' + arrowWeek + '"></div>' +
'<div class="weekMovement">' + weekMovement + '</div>' +
'</div>' +
'</div>' +

'<div class="appPrize"></div>' +

'<div class="appRank">' + this.rankHTML + '</div>' +
'</div>' +

'</div>';
			}
	
			// paid apps
			else {

				var todayMovement = parseInt(r.apps.paid[i].movementdaily);
					if (todayMovement < 0) {
						todayMovement = todayMovement * -1;
						arrowToday = "down";
					}
					else if (todayMovement > 0) {
						arrowToday = "up";
					}

				var weekMovement = parseInt(r.apps.paid[i].movementweekly);
					if (weekMovement < 0) {
						weekMovement = weekMovement * -1;
						arrowWeek = "down";
					}
					else if (weekMovement > 0) {
						arrowWeek = "up";
					}

				this.controller.get(ref.toString()).innerHTML = 
'<div class="listItem">' +

'<div class="appTitle"><a href="http://developer.palm.com/appredirect/?packageid=' + r.apps.paid[i].id + '">' + r.apps.paid[i].title + '</a></div>' +

'<div class="row2">' +

'<div class="iconImg"><a href="http://developer.palm.com/appredirect/?packageid=' + r.apps.paid[i].id + '"><img src="' + r.apps.paid[i].icon1 + '" width=32 height=32 /></a></div>' +

'<div class="movements">' +
'<div class="dailyRow">' +
'<div class="todayLabel">Daily</div>' +
'<div class="todayArrow ' + arrowToday + '"></div>' +
'<div class="todayMovement">' + todayMovement + '</div>' +
'</div>' +

'<div class="weeklyRow">' +
'<div class="weekLabel">Week</div>' +
'<div class="weekArrow ' + arrowWeek + '"></div>' +
'<div class="weekMovement">' + weekMovement + '</div>' +
'</div>' +
'</div>' +

'<div class="appPrize"></div>' +

'<div class="appRank">' + this.rankHTML + '</div>' +
'</div>' +

'</div>';
			}

		}

	}

	// shut spinner off
	this.spinnerModel.spinning = false;
	this.controller.modelChanged(this.spinnerModel);

}

MainAssistant.prototype.failure = function() {
// should probably do something here...

				this.controller.showAlertDialog({
					title: $L("Failure"),
					message: $L("Failure"),
					choices:[
	         				{label:$L('Ok'), value:"refresh", type:'affirmative'}
					]				    
				});
}

MainAssistant.prototype.getRankingHTML = function(rank) {
	var image1  = '<div class="rankNum"></div>';

	if (rank < 100) {

		if (rank > 89) {
			image2 = '<div class="rankNum nine"></div>';
		}

		else if (rank > 79) {
			image2 = '<div class="rankNum eight"></div>';
		}

		else if (rank > 69) {
			image2 = '<div class="rankNum seven"></div>';
		}

		else if (rank > 59) {
			image2 = '<div class="rankNum six"></div>';
		}

		else if (rank > 49) {
			image2 = '<div class="rankNum five"></div>';
		}

		else if (rank > 39) {
			image2 = '<div class="rankNum four"></div>';
		}

		else if (rank > 29) {
			image2 = '<div class="rankNum three"></div>';
		}

		else if (rank > 19) {
			image2 = '<div class="rankNum two"></div>';
		}

		else if (rank > 9) {
			image2 = '<div class="rankNum one"></div>';
		}

		else {
			image2 = '<div class="rankNum zero"></div>';
		}

	}

	else if (rank < 200) {
	
		image1 = '<div class="rankNum one"></div>';
	
		if (rank > 189) {
			image2 = '<div class="rankNum nine"></div>';
		}
	
		else if (rank > 179) {
			image2 = '<div class="rankNum eight"></div>';
		}
	
		else if (rank > 169) {
			image2 = '<div class="rankNum seven"></div>';
		}
	
		else if (rank > 159) {
			image2 = '<div class="rankNum six"></div>';
		}
	
		else if (rank > 149) {
			image2 = '<div class="rankNum five"></div>';
		}
	
		else if (rank > 139) {
			image2 = '<div class="rankNum four"></div>';
		}
	
		else if (rank > 129) {
			image2 = '<div class="rankNum three"></div>';
		}
	
		else if (rank > 119) {
			image2 = '<div class="rankNum two"></div>';
		}
	
		else if (rank > 109) {
			image2 = '<div class="rankNum one"></div>';
		}
	
		else {
			image2 = '<div class="rankNum zero"></div>';
		}
	
	}
	
	else {
	
		image1 = '<div class="rankNum two"></div>';
	
		if (rank > 219) {
			image2 = '<div class="rankNum two"></div>';
		}
	
		else if (rank > 209) {
			image2 = '<div class="rankNum one"></div>';
		}
	
		else {
			image2 = '<div class="rankNum zero"></div>';
		}
	}
	
	
	if ( ((rank-9)%10) == 0) {
		image3 = '<div class="rankNum nine"></div>';
	}
	
	else if ( ((rank-8)%10) == 0) {
		image3 = '<div class="rankNum eight"></div>';
	}
	
	else if ( ((rank-7)%10) == 0) {
		image3 = '<div class="rankNum seven"></div>';
	}
	
	else if ( ((rank-6)%10) == 0) {
		image3 = '<div class="rankNum six"></div>';
	}
	
	else if ( ((rank-5)%10) == 0) {
		image3 = '<div class="rankNum five"></div>';
	}
	
	else if ( ((rank-4)%10) == 0) {
		image3 = '<div class="rankNum four"></div>';
	}
	
	else if ( ((rank-3)%10) == 0) {
		image3 = '<div class="rankNum three"></div>';
	}
	
	else if ( ((rank-2)%10) == 0) {
		image3 = '<div class="rankNum two"></div>';
	}
	
	else if ( ((rank-1)%10) == 0) {
		image3 = '<div class="rankNum one"></div>';
	}
	
	else {
		image3 = '<div class="rankNum zero"></div>';
	}

	this.rankHTML = image1 + image2 + image3;
}

/*********************************
 * begin puchk framework code
 * http://www.jdf-software.com/blog/puchk
 * puchk v0.4.0
 *********************************/

MainAssistant.prototype.doUpdateCheck = function() {
	
	// using Tune Your Guitar Pro (at v1.0.1 at the time of this writing) to force the update scene
	var url = "http://developer.palm.com/webChannel/index.php?packageid=com.jdfsoftware.tuneyourguitarpro";
	// in your app, you would use the following:
	//var url = "http://developer.palm.com/webChannel/index.php?packageid=" + Mojo.Controller.appInfo.id;
	
	// do AJAX request
	var request = new Ajax.Request(url, {
		method: 'get',
		evalJSON: 'false',
		onSuccess: this.gotResults.bind(this), // if you get results, check to see if there's an update
		// we're only concerned with success
	});
	
}

MainAssistant.prototype.gotResults = function(transport) {
	
	// the entire HTML source of the Palm app details web page into a string	
	var HTMLStr = transport.responseText;
	
	// look for Version: in the source and get the text between that and <br/>, this is the version string
	var start = HTMLStr.indexOf("Version: ");
	var end = HTMLStr.indexOf("<br/>", start);
	
	var version = HTMLStr.slice(start+9, end);	
		
	// if the returned version is greater than the current version
	if (this.verComp(version)) {
				
		// show update dialog
		this.controller.showAlertDialog({                            
            		onChoose: function(value) {                                         
                		if (value === "update") {                                      
                			this.launchUpdate();                            
                		}                                                           
            		},                                                                  
            		title: $L("New Version Available"),                                 
            		message: Mojo.Controller.appInfo.title + " v" + version + " " + $L("is available. Would you like to update?"),
            		choices: [                                                          
            			{ label: $L("Download Update"), value: "update", type: "affirmative" },
            			{ label: $L("Cancel"), value: "cancel", type: "negative" }      
            		]                                                                   
        	});          	
	}
			
	// if there's no update, do nothing
}

MainAssistant.prototype.launchUpdate = function() {
	// when the update button is tapped, send the user to the App Catalog for your app	
	var url = "http://developer.palm.com/appredirect/?packageid=" + Mojo.Controller.appInfo.id;

	this.controller.serviceRequest('palm://com.palm.applicationManager',
		{
		method:'open',
		parameters:{target: url}
		});
}

MainAssistant.prototype.verComp = function(v) {
	
	var upd = this.splitVer(v); // most up-to-date version, from the Palm app details page
	var cur = this.splitVer(Mojo.Controller.appInfo.version); // get current app version from appinfo.js
	
	// upd can't be lower than cur or it wouldn't be published
	if (	(upd.major > cur.major) // this is a new major version
			|| ( (upd.major == cur.major) && (upd.minor > cur.minor) ) // this is a new minor version
			|| ( (upd.major == cur.major) && (upd.minor == cur.minor) && (upd.build > cur.build) ) // this is a new build version
		) { return true;}
	
	// otherwise, return false, that there isn't an update
	else { return false; }
}

MainAssistant.prototype.splitVer = function(v) {
	
	var x = v.split('.');
	
    // get the integers of the version parts, or 0 if it can't parse (i.e. 1.4.0 = 1, 4, 0) 
    var major = parseInt(x[0]) || 0;
    var minor = parseInt(x[1]) || 0;
    var build = parseInt(x[2]) || 0;
    return {
        major: major,
        minor: minor,
        build: build
    };
    	
}

/*********************************
 * end puchk framework code
 *********************************/


MainAssistant.prototype.activate = function(event) {
};

MainAssistant.prototype.deactivate = function(event) {
};

MainAssistant.prototype.cleanup = function(event) {
};
