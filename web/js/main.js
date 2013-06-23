var helper; // the CBHelper object
var map; // The Google maps object
var markers; // The Google maps markers
var troops = {}; // Your troops
var selected_troop;
var currentPosition; // The shared current position object
var pushToken; // A push notification token for the device
var paths = {}
var polyOptions = {
	strokeColor: '#000000',
	strokeOpacity: 1.0,
	strokeWeight: 3
}

$(document).ready(function() {

	/*
	 * *********************
	 * 'normal' jQuery stuff
	 * *********************
	 */

    $(window).resize(function() {
        resizeCommandHistory();
    });

    function resizeCommandHistory() {
        var list_height = $(window).height() - $('aside').find('form').height();
        $('aside').find('ul').css('height', list_height);
    }

    resizeCommandHistory();

	/*
	 * ***********
	 * Google maps
	 * ***********
	 */

	function initialize() {

		/*
		 * ***************
		 * Cloudbase setup
		 * ***************
		 * 
		 * We do this within the Google maps initialise() so we can get access to the commander latlong
		 *
		 */

		// initialise the helper object with the code, secret code and the
		// generic helper
		helper = new CBHelper(
		    "commandandinfluence", 
		    "17b41ff67e279f762ba20a5bbc3fa959", 
		    new GenericHelper()
		);

		// use the md5 library provided to set the password
		helper.setPassword(hex_md5("76Indnja"));

		// we only do searches based on proximity, not keywords
		var search = {
	//        'cb_location' : {
	//            '$near' : [ currentPosition.lat, currentPosition.lng ],
	//            // 5km (5000 meters converted to radians)
	//            '$maxDistance' :  5/111.12 
	//        },
	//        'cb_limit' : 26
		};

		// call the searchDocuments function
		helper.searchDocuments(search, "user", function(resp) {
		    console.log(resp);
		    console.log(resp.outputString);

		    var json  = $.parseJSON(resp.outputString);

		    // add markers for your troops
		    $(json.data.message).each(function(index, value){
		        console.log('value', value);
		        add_marker(value.id, value.cb_location.lat, value.cb_location.lng, value.last_name);
		    });

		});

	    var mapOptions = {
	        zoom: 15,
//	        mapTypeId: google.maps.MapTypeId.TERRAIN,
	        streetViewControl: false //,
//	        maxZoom: 22,
//	        minZoom: 12
	    };
	    map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);

	    google.maps.event.addListener(map, 'click', function(event) {

	    	console.log('Clicked on map', event);

	        // no troop selected
	        if (typeof(selected_troop) == 'undefined') {
	        	alert('Select a troop, Commander!');
		        $('#location').focus();
	            return false;
	        }

			$("#location").val(event.latLng.jb + " " + event.latLng.kb);
		});

	    // Try HTML5 geolocation
	    if (navigator.geolocation) {

	        navigator.geolocation.getCurrentPosition(function(position) {
	            var pos = new google.maps.LatLng(
	                position.coords.latitude,
	                position.coords.longitude
	            );

//	            var infowindow = new google.maps.InfoWindow({
//	                map: map,
//	                position: pos,
//	                content: 'You are here.'
//	            });

				new google.maps.Marker({
					position: pos,
					map: map,
	                animation: google.maps.Animation.BOUNCE
				});

	            map.setCenter(pos);

				currentPosition = new CBHelperCurrentLocation(position.coords.latitude, position.coords.longitude, position.coords.altitude);
				helper.currentLocation = currentPosition;

//				infowindow = new google.maps.InfoWindow({
//					content: "<div style='width:200px; height:100px; overflow:scroll;'><img style='float:left; margin:0 5px 5px 0;' src=\""+val[1].picUrl+"\" >"+val[1].name+": Peerindex: "+val[0]+" tweet: "+val[1].tweet+"</div>"
//				});


//				var pushManager = new PushNotificationManager();
				
//				pushManager.register(function(token) {
//					// subscribe the current device to the push notification channel
//					pushToken = token;
//				});

	        }, function() {
	            handleNoGeolocation(true);
	        });


	        // grabs the new position and updates the map
			function updateLocation() {
				navigator.geolocation.getCurrentPosition(
					function (position) {
						mosync.rlog("received position: lat: " + position.coords.latitude + " lng: " + position.coords.longitude);
						// set the current location in the helper class
						// re-center the map
						var newCenter = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
						map.setCenter(newCenter);
						// update friends locations
						updateLocations();
					},
					function (error) {
						mosync.rlog("Error while updating location");
						mosync.rlog(error.message);
					}
				);
			}

	    } else {
	        // Browser doesn't support Geolocation
	        handleNoGeolocation(false);
	    }
	}

	function handleNoGeolocation(errorFlag) {
		if (errorFlag) {
		    var content = 'Error: The Geolocation service failed.';
		} else {
		    var content = 'Error: Your browser doesn\'t support geolocation.';
		}

		var options = {
		    map: map,
		    position: new google.maps.LatLng(60, 105),
		    content: content
		};

		var infowindow = new google.maps.InfoWindow(options);
	    map.setCenter(options.position);
	}

	google.maps.event.addDomListener(window, 'load', initialize);

	function add_marker(id, latitude, longitude, surname) {

	    // grab a random colour and letter
	    console.log('add_marker', id, latitude, longitude, surname);

	    // add marker
	    troops[id] = new google.maps.Marker({
	    	name: surname,
	        letter: surname[0].toUpperCase(),
	        colour: 'darkgreen',
	        position: new google.maps.LatLng(latitude, longitude),
	        map: map,
	        title: latitude + ', ' + longitude,
	        icon: markers.directory + 'darkgreen' + '_marker' + surname[0].toUpperCase() + '.png',
	        defaultIcon: markers.directory + 'darkgreen' + '_marker' + surname[0].toUpperCase() + '.png',
	        selectedIcon: markers.directory + 'red' + '_marker' + surname[0].toUpperCase() + '.png',
	        draggable: true
	    });

	    paths[id] = new google.maps.Polyline(polyOptions);
		paths[id].setMap(map);

		google.maps.event.addListener(troops[id], 'click', function() {
//			console.log('this', this);
			console.log('clicked marker', this.name);
			reset_marker_icons();
			selected_troop = id;
			this.setIcon(this.selectedIcon);
		});

	}

	/*
	 * remove a troop marker
	 */
	function remove_marker(id) {

	    console.log('removing marker', id);

	    // add marker
	    delete(troops[id]);
	    delete(paths[id]);

		google.maps.event.addListener(troops[id], 'click', function() {
			console.log('removed marker', id);
		});

	}

	/*
	 * reposition a troop marker
	 */
	function update_marker(id, latitude, longitude) {
		console.log('update_marker', latitude, longitude, id);
	    troops[id].setPosition(new google.maps.LatLng(latitude, longitude));
		var path = paths[id].getPath();
		path.push(new google.maps.LatLng(latitude, longitude));
		delete(path[0]);
	}

	function reset_marker_icons() {
		console.log('reset_marker_icons', troops);
        //  reset all the icons back to normal except the one you clicked
//        $(troops).each(function(index, value) {
//        	console.log('troops[' + index + ']', value);
//            value.setIcon(value.defaultIcon);
//        });

    }

	// @todo associate users with letters (first letter of first name?) and colours
	var markers = {
	    directory: '/img/markers/',
	    colours: [
	        'blue', 'brown', 'darkgreen', 'green', 'orange',
	        'paleblue', 'pink', 'purple', 'red', 'yellow'
	    ],
	    letters: [
	        'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 
	        'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'
	    ]
	}

	/*
	 * **************
	 * Pusher scripts
	 * **************
	 */

    Pusher.log = function(message) {
        if (window.console && window.console.log) {
            window.console.log(message);
        }
    };

    Pusher.channel_auth_endpoint = 'http://jakexks.com/pusher/auth.php';

    var pusher = new Pusher('7d3ebc72c0912d712cd6');
    
    var channel = pusher.subscribe('presence-game-1');
    
    // pusher:subscription_error
    channel.bind('pusher:subscription_error', function(error) {
        console.log(error);
    });

    // pusher:subscription_succeeded
    channel.bind('pusher:subscription_succeeded', function(data) {
        
    });

    // form submit
    $("#sendmessage").click(function(e) {

    	e.preventDefault();

        var message = $('#message').val();

        // no troop selected
        console.log('selected_troop', selected_troop);
        if (typeof(selected_troop) == 'undefined') {
        	alert('Select a troop, Commander!');
	        $('#message').focus();
            return false;
        }

        // empty message
        if (message == '') {
        	alert('We need a command, Commander!');
	        $('#message').val('');
	        $('#message').focus();
            return false;
        }

        // add to command history
        $('#command-history').prepend('<li>' + message + '</li>');
        
        // fade in
        $('#command-history').find('li:first').hide().fadeIn();

        // send to pusher                    
        channel.trigger('client-command', {
            'message': message,
            'from': 'commander',
            'to': selected_troop
        });

        // focus for easy re-entry
        $('#message').val('');
        $('#message').focus();

        // scroll to top of message history
        $('#command-history')[0].scrollTop = 0;

        // stop default form submit
        return false;

    });

    $("#sendlocation").click(function(e) {
    	
    	e.preventDefault();

        // no troop selected
        console.log('selected_troop', selected_troop);
        if (typeof(selected_troop) == 'undefined') {
        	alert('Select a troop, Commander!');
	        $('#location').focus();
            return false;
        }

    	var latlng = $("#location").val().trim().split(" ");
    	if (latlng.length < 2) {
    		$("#location").val("");
    		$("#location").focus();
    		return false;
    	}

    	$("#command-history").prepend('<li>' + 'Move to map location' + '</li>');

    	// fade in
    	$("#command-history").find('li:first').hide().fadeIn();

    	// send to pusher
    	channel.trigger('client-command', {
    		'message' : $("#message").val(),
    		'command' : 'goto',
    		'extras' : { 'lat' : latlng[0], 'lng' : latlng[1]}
    	});

    	$("#location").val('');

    	$("#command-history")[0].scrollTop = 0;

    	return false;
    });

    // pusher:member_added
    channel.bind('pusher:member_added', function(member) {
        console.log('pusher:member_added', member);
    });

    // pusher:member_removed
    channel.bind('pusher:member_removed', function(member) {
        console.log('pusher:member_removed', member);
    });

    // client-location
    channel.bind('client-location', function(data) {
        console.log('client-location', data);
        // surname this is hardcoded for now until we handle marker add/update
        update_marker(data.user, data.location.latitude, data.location.longitude);
    });

	// http://paul-sobek.com/LocPeerIndexResultsExample.html
	$.getJSON('http://paul-sobek.com/cgi-home/getLoc.py?lat=51.507887&lon=-0.131149&radius=1km', function(data) {
		var items = [];

		$.each(data, function(key, val) {

		console.log('Twitter/peerindex', val[1].geo.coordinates[0]);
		console.log('Twitter/peerindex', val[1].geo.coordinates[1]);
		console.log('Twitter/peerindex', val[1].name);
		console.log('Twitter/peerindex', val[1].tweet);
		console.log('Twitter/peerindex', val[0]);
		infowindow = new google.maps.InfoWindow({
			content: "<div style='width:200px; height:100px; overflow:scroll;'><img style='float:left; margin:0 5px 5px 0;' src=\""+val[1].picUrl+"\" >"+val[1].name+": Peerindex: "+val[0]+" tweet: "+val[1].tweet+"</div>"
		});

		var marker = new google.maps.Marker({
			position: new google.maps.LatLng(val[1].geo.coordinates[0], val[1].geo.coordinates[1]),
			map: map,
			title: val[1].name 
		});
		google.maps.event.addListener(marker, 'click', function() {
			infowindow.open(map,marker);
		});
		//console.log('Twitter/peerindex', val[1].picUrl);
		});
	});

	/*
	$('#summon').click(function(e){
		e.preventDefault();
		$.ajax({
			type: "POST",
			url: 'https://api.cloudbase.io/commandandinfluence/notifications',
			data: {
				'app_uniq' : '17b41ff67e279f762ba20a5bbc3fa959',
				'app_pwd' : hex_md5('76Indnja'),
				'device_uniq' : 'webapp',
				'post_data' : { 
					'channel': 'all',
					'alert' : 'Help us track down this man'
				},
				'output_format': 'jsonp',
				'jsonp_function': 'foo'
			},
			success: function(response){
				console.log('response', response);
			},
			dataType: 'jsonp',
			jsonp: 'foo'
		});
		return false;
	});
	*/

});
