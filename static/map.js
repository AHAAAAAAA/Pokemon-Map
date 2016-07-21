var map, 
    currentMarker,
    lastStamp = 0,
    requestInterval = 10000;

var markers = [];
var gym_types = [ "Uncontested", "Mystic", "Valor", "Instinct" ];

function pad(number) {
    return number <= 99 ? ("0" + number).slice(-2) : number;
};

pokemonLabel = function(item) {
    disappear_date = new Date(item.disappear_time);

    var str = '\
        <div>\
            <b>' + item.pokemon_name + '</b>\
            <span> - </span>\
            <small>\
                <a href="http://www.pokemon.com/us/pokedex/' + item.pokemon_id + '" target="_blank" title="View in Pokedex">#' +item.pokemon_id + '</a>\
            </small>\
        </div>\
        <div>\
            Disappears at ' + pad(disappear_date.getHours()) + ':' + pad(disappear_date.getMinutes()) + ':' + pad(disappear_date.getSeconds()) + '\
            <span class="label-countdown" disappears-at="' + item.disappear_time + '"></span></div>\
        <div>\
            <a href="https://www.google.com/maps/dir/Current+Location/' + item.latitude + ',' + item.longitude + '"\
                    target="_blank" title="View in Maps">Get Directions</a>\
        </div>';

    return str;
};

gymLabel = function gymLabel(item) {
    var gym_color = [ "0, 0, 0, .4", "74, 138, 202, .6", "240, 68, 58, .6", "254, 217, 40, .6" ];
    var str;
    if (gym_types[item.team_id] == 0) {
        str = '\
            <div><center>\
            <div>\
                <b style="color:rgba(' + gym_color[item.team_id] + ')">' + gym_types[item.team_id] + '</b><br>\
            </div>\
            </center></div>';
    } else {
        str = '\
            <div><center>\
            <div>\
                Gym owned by:\
            </div>\
            <div>\
                <b style="color:rgba(' + gym_color[item.team_id] + ')">Team ' + gym_types[item.team_id] + '</b><br>\
                <img height="100px" src="/static/forts/' + gym_types[item.team_id] + '_large.png"> \
            </div>\
            <div>\
                Prestige: ' + item.gym_points + '\
            </div>\
            </center></div>';
    }

    return str;
};

pokestopLabel = function pokestopLabel(item) {
    var str;

    if (!item.lure_expiration) {
        str = '<div><center> \
                   <div><b>Pokéstop</b></div> \
               </center></div>';
    } else {
        expire_date = new Date(item.lure_expiration)
        str = '<div><center> \
                   <div><b>Pokéstop</b></div> \
                   <div><b>Lure enabled</b></div> \
                   Expires at ' + pad(expire_date.getHours()) + ':' + pad(expire_date.getMinutes()) + ':' + pad(expire_date.getSeconds()) + '\
                   <span class="label-countdown" disappears-at="' + item.lure_expiration + '"></span></div>\
               </center></div>';
    }
    return str;
}

initMap = function() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: center_lat, lng: center_lng},
        zoom: 16,
        //default to roadmap
        mapTypeId: google.maps.MapTypeId.ROADMAP
    });
    
    InitPlaces();

    //set current marker
    setCurrentMarker(center_lat, center_lng);

    GetNewPokemons(lastStamp);
    GetNewGyms(lastStamp);
    GetNewPokeStops(lastStamp);
};

GetNewPokemons = function(stamp) {
    $.getJSON("/pokemons/"+stamp, function(result){
        $.each(result, function(i, item){

            var marker = new google.maps.Marker({
                position: {lat: item.latitude, lng: item.longitude},
                map: map,
                icon: 'static/icons/'+item.pokemon_id+'.png'
            });

            marker.infoWindow = new google.maps.InfoWindow({
                content: pokemonLabel(item)
            });

            google.maps.event.addListener(marker.infoWindow, 'closeclick', function(){
                delete marker["persist"];
                marker.infoWindow.close();
            });

            marker.addListener('click', function() {
                marker["persist"] = true;
                marker.infoWindow.open(map, marker);
            });

            markers.push({
                    m: marker,
                    disapear: item.disappear_time});

            marker.addListener('mouseover', function() {
                marker.infoWindow.open(map, marker);
            });

            marker.addListener('mouseout', function() {
                if (!marker["persist"]) {
                    marker.infoWindow.close();
                }
            });
        });        
    }).always(function() {
        setTimeout(function() {
            GetNewPokemons(lastStamp);
            GetNewGyms(lastStamp);
            GetNewPokeStops(lastStamp);
        }, requestInterval)
    });

    var dObj = new Date();
    lastStamp = dObj.getTime();
    
    $.each(markers, function(i, item){
        if (item.disapear <= lastStamp - (dObj.getTimezoneOffset() * 60000))        
            item.m.setMap(null);        
    });
};

GetNewGyms = function(stamp) {
    $.getJSON("/gyms/"+stamp, function(result){
        $.each(result, function(i, item){
            var marker = new google.maps.Marker({
                position: {lat: item.latitude, lng: item.longitude},
                map: map,
                icon: 'static/forts/'+gym_types[item.team_id]+'.png'
            });

            marker.infoWindow = new google.maps.InfoWindow({
                content: gymLabel(item)
            });

            google.maps.event.addListener(marker.infoWindow, 'closeclick', function(){
                delete marker["persist"];
                marker.infoWindow.close();
            });

            marker.addListener('click', function() {
                marker["persist"] = true;
                marker.infoWindow.open(map, marker);
            });

            marker.addListener('mouseover', function() {
                marker.infoWindow.open(map, marker);
            });

            marker.addListener('mouseout', function() {
                if (!marker["persist"]) {
                    marker.infoWindow.close();
                }
            });
        });
    });
};

GetNewPokeStops = function(stamp) {
    $.getJSON("/pokestops/"+stamp, function(result){
        $.each(result, function(i, item){
            var imagename = item.lure_expiration ? "PstopLured" : "Pstop";
            var marker = new google.maps.Marker({
                position: {lat: item.latitude, lng: item.longitude},
                map: map,
                icon: 'static/forts/'+ imagename +'.png'
            });

            marker.infoWindow = new google.maps.InfoWindow({
                content: pokestopLabel(item)
            });

            if (item.lure_expiration) {
                google.maps.event.addListener(marker.infoWindow, 'closeclick', function(){
                    delete marker["persist"];
                    marker.infoWindow.close();
                });

                marker.addListener('click', function() {
                    marker["persist"] = true;
                    marker.infoWindow.open(map, marker);
                });

                marker.addListener('mouseover', function() {
                    marker.infoWindow.open(map, marker);
                });

                marker.addListener('mouseout', function() {
                    if (!marker["persist"]) {
                        marker.infoWindow.close();
                    }
                });
            } else {
                marker.addListener('click', function() {
                    marker.infoWindow.open(map, marker);
                });
            }
        });
    });
};

var setLabelTime = function(){
$('.label-countdown').each(function (index, element) {
    var now = new Date().getTime();
    var diff = element.getAttribute("disappears-at") - now;

    if (diff > 0) {
        var min = Math.floor((diff / 1000) / 60);
        var sec = Math.floor((diff / 1000) - (min * 60));
        $(element).text("(" + pad(min) + "m" + pad(sec) + "s" + ")");
    } else {
        $(element).text("(Gone!)");
    }


    });
};

/**
 * set the current marker location
 * lat = latitude, lng = longitude, title = name of the marker
 */
var setCurrentMarker = function(lat, lng, title){
    if(currentMarker!=null){
        //clear the marker
        currentMarker.setMap(null);
        currentMarker = null;
    }

    var newLocation={};
    newLocation.lat=lat;
    newLocation.lng=lng;

    currentMarker = new google.maps.Marker({
        position: newLocation,
        map: map,
        title: title,
        animation: google.maps.Animation.DROP
    });
};

//PLACES ADDITION

InitPlaces = function(){
    var sInput = document.getElementById('pac-input');
    var searchBox = new google.maps.places.SearchBox(sInput);
    map.controls[google.maps.ControlPosition.TOP_LEFT].push(sInput);

    // Bias the SearchBox results towards current map's viewport.
    map.addListener('bounds_changed', function() {
        searchBox.setBounds(map.getBounds());
    });

    // Listen for the event fired when the user selects a prediction and retrieve
    // more details for that place.
    searchBox.addListener('places_changed', function() {
        var places = searchBox.getPlaces();

        if (places.length == 0) {
            return;
        }

        // For each place, get the icon, name and location.
        var bounds = new google.maps.LatLngBounds();
        places.forEach(function(place) {

            //for now we assume one place, technically this is a for loop
            //so its possible to set current marker multiple times
            setCurrentMarker(place.geometry.location.lat(), place.geometry.location.lng(), place.name);
            
            //lets make a call to the api to change the lat lon, reset the search
            setNewLocation(place.geometry.location.lat(), place.geometry.location.lng());
           
            if (place.geometry.viewport) {
                // Only geocodes have viewport.
                bounds.union(place.geometry.viewport);
            } else {
                bounds.extend(place.geometry.location);
            }
        });

        //reset the map focus
        map.fitBounds(bounds);
        map.setZoom(15);
    });
};

window.setInterval(setLabelTime, 1000);
