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



//представление Poi в списке
var poiListView = Backbone.View.extend({

    tagName: 'li',
    className: 'b-poi__list__frame',
    template: _.template($('#poi-list__template').html()),

    events:{
        'click .b-edit': 'openEditor',
        'click .b-delete': 'destroy'
    },

    initialize: function(){
        this.create();
        this.model.bind("change", this.render, this);
        this.model.bind("destroy", this.destroyView, this);
    },

    destroy: function(){
        if(confirm()){
            this.model.destroy();
        }
    },

    destroyView: function(){
        this.$el.remove();
    },

    create: function(){
        $('.b-poi__list').append(this.$el.html(this.template(this.model)));
    },

    render: function(){
        this.$el.html(this.template(this.model));

        if(this.model.get('animation')){
            this.$el.addClass('animate');
        } else {
            this.$el.removeClass('animate');
        }
    },

    openEditor: function(){
        this.model.set({
            edit : true,
            animation : true
        });
    }


});



//представление Poi в окне редактирования
var poiEditorView = Backbone.View.extend({

    tagName: 'div',
    className: 'b-poi-editor',
    template: _.template($('#poi-editor__template').html()),

//  почему не работает?
//    events: {
//        'click .b-saveEdit': 'saveModel',
//        'click .b-closeEdit': 'closeEditor'
//    },

    initialize: function(){
        this.model.bind("change", this.render, this);
        this.model.bind("destroy", this.closeEditor, this);
    },

    domEvents: function(){
        $('.b-saveEdit').on('click', $.proxy(this.saveModel, this));
        $('.b-closeEdit').on('click', $.proxy(this.closeEditor, this));
    },

    render: function(){

        this.$el.remove();

        if(this.model.get('edit')){
            $('.b-poi__list').append(this.$el.html(this.template(this.model)));
        }
        this.domEvents();

    },

    closeEditor: function(){
        this.model.set({
            edit: false,
            animation: false
        });
    },

    saveModel: function(){
        this.model.set({
            title: this.$el.find('.edit__title').val(),
            description: this.$el.find('.edit__description').val()
        });
    }

});



//коллекция Poi
var poiAppCollection = Backbone.Collection.extend({

    initialize: function(){
        this.createMap();
        this.fetchPois();
        this.domEvents();
    },

    domEvents: function(){
        $('.b-toggle__editor').on('click', $.proxy(this.listenMapClick, this));
    },

    createMap: function(){
        var mapOptions = {
            zoom: 2,
            center: new google.maps.LatLng(0, 0)
        };
        map = new google.maps.Map(document.getElementById('map'), mapOptions);
    },

    listenMapClick: function(){
        var self = this;
        this.listener = google.maps.event.addListener(map, 'click', function(event) {
            self.createNewModel(event.latLng);
            self.stopListenMapClick();
        });
    },

    stopListenMapClick: function(){
        google.maps.event.removeListener(this.listener);
    },


//    загрузка Poi с хранилища
    fetchPois: function(){
        if(localStorage.getItem('PoiStorage')){
            var PoiList = JSON.parse(localStorage.getItem('PoiStorage'));
            for(var i=0; i<PoiList.length; i++){
                var newModel = new poiModel({
                    title: JSON.parse(localStorage.getItem('PoiStorage'))[i].title,
                    description: JSON.parse(localStorage.getItem('PoiStorage'))[i].description,
                    location: new google.maps.LatLng(JSON.parse(localStorage.getItem('PoiStorage'))[i].positionK, JSON.parse(localStorage.getItem('PoiStorage'))[i].positionA),
                    id: JSON.parse(localStorage.getItem('PoiStorage'))[i].id
                });

                var PoiView = new poiMapView({model:newModel});
                var PoiListView = new poiListView({model:newModel});
                var PoiEditorView = new poiEditorView({model:newModel});
                this.add(newModel);
            }
        }
    },

//    создание новой Poi
    createNewModel: function(location){
        var newModelId = 0;

        if(JSON.parse(localStorage.getItem('PoiStorage'))) {
            newModelId = +localStorage.getItem('PoiStorageId') + 1;
            localStorage.setItem('PoiStorageId', newModelId);
        }

        var newModel = new poiModel({
            id: newModelId,
            location: new google.maps.LatLng(location.k, location.A),
            title: 'New POI ' + newModelId,
            positionK: location.k,
            positionA: location.A,
            animation: false
        });

        newModel.save({
            id: newModelId,
            title: 'New POI ' + newModelId,
            positionK: location.k,
            positionA: location.A
        });

        var PoiView = new poiMapView({model:newModel});
        var PoiListView = new poiListView({model:newModel});
        var PoiEditorView = new poiEditorView({model:newModel});
        this.add(newModel);
    }


});

var App = new poiAppCollection;