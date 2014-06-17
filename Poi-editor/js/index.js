//модель Poi

var poiModel = Backbone.Model.extend({

    defaults:{
        title: 'New POI',
        description: '',
        positionK: '',
        positionA: '',
        edit : false,
        animation : false
    },

    initialize: function(){
        this.bind("change", this.update);
    },

    save: function(model){

        var PoiStorage = [];

        if(localStorage.getItem('PoiStorage')) {
            PoiStorage = JSON.parse(localStorage.getItem('PoiStorage'));
        }

        PoiStorage.push({
            id: model.id,
            title: model.title || this.get('title'),
            description: model.description || this.get('description'),
            positionK: model.positionK,
            positionA: model.positionA
        });

        localStorage.setItem('PoiStorage', JSON.stringify(PoiStorage));
    },

    update: function(){
        var PoiStorage = JSON.parse(localStorage.getItem('PoiStorage'));

        for(var i=0; i<PoiStorage.length; i++){
            if(PoiStorage[i].id == this.get('id')){
                PoiStorage[i].title = this.get('title');
                PoiStorage[i].description = this.get('description');
                PoiStorage[i].positionK = this.get('positionK') || this.get('location').k;
                PoiStorage[i].positionA = this.get('positionA') || this.get('location').A;
            }
        }

        localStorage.setItem('PoiStorage', JSON.stringify(PoiStorage));
    },

    destroy: function(){
        var PoiStorage = JSON.parse(localStorage.getItem('PoiStorage'));

        for(var i=0; i<PoiStorage.length; i++){
            if(PoiStorage[i].id == this.get('id')){
                PoiStorage.splice(i, 1);
            }
        }
        if(PoiStorage.length === 0){
            localStorage.setItem('PoiStorageId', 0);
        }
        localStorage.setItem('PoiStorage', JSON.stringify(PoiStorage));
        this.trigger('destroy');
    }


});



//представление Poi на карте
var poiMapView = Backbone.View.extend({
    el: '.h-map',
    template: _.template($('#poi-map__template').html()),

    initialize: function(){
        this.createMarker();
        this.model.bind("change", this.updateMarker, this);
        this.model.bind("destroy", this.destroyMarker, this);
    },

    createMarker: function(model){


//        этот self меня тоже не устраивает, но другого не придумал для google.maps.event
//        $.proxy не помогло

        var self = this;

        this.marker = new google.maps.Marker({
            position: this.model.get('location'),
            map: map,
            draggable: true
        });


        this.infoWindow = new google.maps.InfoWindow({
            content: this.template(this.model)
        });

        google.maps.event.addListener(this.marker, 'click', function() {
            self.model.set({animation: true});
            self.infoWindow.open(map, self.marker);
        });
        google.maps.event.addListener(self.infoWindow,'closeclick',function(){
            self.model.set({animation: false});
        });

        google.maps.event.addListener(this.marker, 'dragend', function(event) {
            self.model.set({
                location: event.latLng,
                positionK: event.latLng.k,
                positionA: event.latLng.A
            });
        })
    },

    updateMarker: function(model){

        var positionK = this.model.get('positionK') || this.model.get('location').k;
        var positionA = this.model.get('positionA') || this.model.get('location').A;
        var latlng = new google.maps.LatLng(positionK, positionA);
        this.marker.setPosition(latlng);

        if(this.infoWindow) this.infoWindow.close();

        this.infoWindow.content = this.template(model);

        if(this.model.get('animation')){
            this.marker.setAnimation(google.maps.Animation.BOUNCE);
        } else {
            this.marker.setAnimation(null);
        }

    },

    destroyMarker: function(){
        this.marker.setMap(null);
    }


});