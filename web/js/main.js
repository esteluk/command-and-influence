var helper; // the CBHelper object
var map; // The Google maps object
var markers; // The Google maps markers
var troops = {}; // Your troops
var selected_troop;
var currentPosition; // The shared current position object
var pushToken; // A push notification token for the device

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
	        zoom: 16,
//	        mapTypeId: google.maps.MapTypeId.TERRAIN,
	        streetViewControl: false //,
//	        maxZoom: 22,
//	        minZoom: 12
	    };
	    map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);

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
	    troops[surname] = null;

		google.maps.event.addListener(troops[surname], 'click', function() {
			console.log('clicked marker', surname);
		});

	}

	/*
	 * reposition a troop marker
	 */
	function update_marker(id, latitude, longitude) {
		console.log('update_marker', latitude, longitude, id);
	    troops[id].setPosition(new google.maps.LatLng(latitude, longitude));
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
    $("form").submit(function(e) {

    	e.preventDefault();

        var command = $('#command').val();

        // no troop selected
        console.log('selected_troop', selected_troop);
        if (typeof(selected_troop) == 'undefined') {
        	alert('Select a troop, Commander!');
	        $('#command').focus();
            return false;
        }

        // empty command
        if (command == '') {
        	alert('We need a command, Commander!');
	        $('#command').val('');
	        $('#command').focus();
            return false;
        }

        // add to command history
        $('#command-history').prepend('<li>' + command + '</li>');
        
        // fade in
        $('#command-history').find('li:first').hide().fadeIn();

        // send to pusher                    
        channel.trigger('client-command', {
            'command': command,
            'from': 'commander',
            'to': selected_troop
        });

        // focus for easy re-entry
        $('#command').val('');
        $('#command').focus();

        // scroll to top of message history
        $('#command-history')[0].scrollTop = 0;

        // stop default form submit
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

});
