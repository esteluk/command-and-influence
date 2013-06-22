$(document).ready(function() {

	/*
	 * ***********************
	 * jQuery & 'normal' stuff
	 * ***********************
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

	var map;

	function initialize() {
	    var mapOptions = {
	        zoom: 19,
	        mapTypeId: google.maps.MapTypeId.TERRAIN,
	        streetViewControl: false
	    };
	    map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);

	    // Try HTML5 geolocation
	    if (navigator.geolocation) {
	        navigator.geolocation.getCurrentPosition(function(position) {
	            var pos = new google.maps.LatLng(
	                position.coords.latitude,
	                position.coords.longitude
	            );

	            var infowindow = new google.maps.InfoWindow({
	                map: map,
	                position: pos,
	                content: 'Location found using HTML5.'
	            });

	            map.setCenter(pos);
	        }, function() {
	            handleNoGeolocation(true);
	        });

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

	function update_marker(latitude, longitude) {

	    // grab a random colour and letter
	    var colour = markers.colours[Math.floor(Math.random() * markers.colours.length)];
	    var letter = markers.letters[Math.floor(Math.random() * markers.letters.length)];

	    markers.sample_latlongs[Math.floor(Math.random() * 3)];

	    // add marker
	    new google.maps.Marker({
	        position: new google.maps.LatLng(latitude, longitude),
	        map: map,
	        title: latitude + ', ' + longitude,
	        icon: markers.directory + colour + '_marker' + letter + '.png'
	    });

	}

	var markers = {
	    directory: '/img/markers/',
	    colours: [
	        'blue', 'brown', 'darkgreen', 'green', 'orange',
	        'paleblue', 'pink', 'purple', 'red', 'yellow'
	    ],
	    letters: [
	        'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 
	        'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'
	    ],
	    sample_latlongs: [
	        [51.508318430739585, -0.13164818286895752],
	        [51.507864349067205, -0.13120830059051514],
	        [51.508318430739585, -0.13216853141784668]
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

        // empty message
        if (command == '') {
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
            'command': command
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
        update_marker(data.location.latitude, data.location.longitide);
    });

	/*
	 * *********
	 * Cloudbase
	 * *********
	 */

	// initialise the helper object with the code, secret code and the
	// generic helper
	var helper = new CBHelper(
	    "commandandinfluence", 
	    "17b41ff67e279f762ba20a5bbc3fa959", 
	    new GenericHelper()
	);

	// use the md5 library provided to set the password
	helper.setPassword(hex_md5("76Indnja"));

	// we only do searches based on proximity, not keywords
	var search = {
	//            'cb_location' : {
	//                '$near' : [ currentPosition.lat, currentPosition.lng ],
	//                // 5km (5000 meters converted to radians)
	//                '$maxDistance' :  5/111.12 
	//            },
	//            'cb_limit' : 26
	};
	// call the searchDocuments function
	helper.searchDocuments(search, "user", function(resp) {
	    console.log(resp);
	    console.log(resp.outputString);

	    var json  = $.parseJSON(resp.outputString);

	    $(json.data.message).each(function(i, e){
	        console.log('e', e);
	        // update_marker(data.location.latitude, data.location.longitide);
	    });

	});

});
