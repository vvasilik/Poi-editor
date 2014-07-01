//модель Poi

var poiModel = Backbone.Model.extend({

    initialize: function(){
        this.listenTo(this, "change", this.saveModel);
    },

    saveModel: function (model) {model.save()}

});



//представление Poi на карте
var poiMapView = Backbone.View.extend({
    el: '.h-map',
    template: _.template($('#poi-map__template').html()),

    initialize: function(){
        this.createMarker();
        this.listenTo(this.model, "change", this.render, this);
        this.listenTo(this.model, "destroy", this.destroyMarker, this);
    },


    createMarker: function () {

        this.marker = new google.maps.Marker({
            position: new google.maps.LatLng(this.model.get('positionLat'), this.model.get('positionLng')),
            map: map,
            draggable: true
        });

        var openInfoWondow = $.proxy(function () {
            this.infoWindow.open(map,this.marker);
        }, this);

        var saveDragendMarker = $.proxy(function (event) {
            this.model.set({
                positionLat: event.latLng.lat(),
                positionLng: event.latLng.lng()
            });
        }, this);

        this.infoWindow = new google.maps.InfoWindow({
            content: this.template(this.model)
        });

        google.maps.event.addListener(this.marker, 'click', openInfoWondow);

        google.maps.event.addListener(this.marker, 'dragend', saveDragendMarker);

    },


    render: function () {
        this.infoWindow.setContent(this.template(this.model))
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
        this.listenTo(this.model, "change", this.render, this);
        this.listenTo(this.model, "destroy", this.destroyView, this);
    },

    destroy: function(){
        if(confirm('Удалить точку?')){
            this.model.destroy();
        }
    },

    destroyView: function(){
        this.$el.remove();
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
        this.listenTo(this.model, "change", this.render, this);
        this.listenTo(this.model, "destroy", this.closeEditor, this);
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
        this.model.save({
            title: this.$el.find('.edit__title').val(),
            description: this.$el.find('.edit__description').val()
        });
    }

});



//коллекция Poi
var poiAppCollection = Backbone.Collection.extend({

    model: poiModel,
    localStorage: new Backbone.LocalStorage("PoiEditor")

});

var App = new poiAppCollection;



var mainView = Backbone.View.extend({
    el: '.h-wrapper',

    events:{
        "click .b-toggle__editor": 'listenMapClick'
    },

    initialize: function () {
        this.createMap();
        this.listenTo(App, 'add', this.addOne);
        App.fetch();
        this.countId();
    },

    createMap: function(){
        var mapOptions = {
            zoom: 2,
            center: new google.maps.LatLng(0, 0)
        };
        map = new google.maps.Map(document.getElementById('map'), mapOptions);
    },

    listenMapClick: function(){
        var mapClickListener = $.proxy(function (event) {
            this.createNewModel(event.latLng);
            this.stopListenMapClick();
        }, this);

        this.listener = google.maps.event.addListener(map, 'click', mapClickListener);
    },

    stopListenMapClick: function(){
        google.maps.event.removeListener(this.listener);
    },

    countId: function () {
        if(!App.length) {
            this.counter = 0;
        } else {
            this.counter = _.max(App.pluck('id')) + 1 || 0;
        }
    },

    createNewModel: function (event) {
        App.create({
            positionLat: event.lat(),
            positionLng: event.lng(),
            title: 'New POI ' + this.counter,
            id: this.counter
        });
        this.counter++;
    },

    addOne: function (model) {
        model.set({
            edit : false,
            animation : false
        });
        var PoiMapView = new poiMapView({model: model});
        var PoiEditorView = new poiEditorView({model: model});
        var PoiListView = new poiListView({model: model});
        $('.b-poi__list').append(PoiListView.$el.html(PoiListView.template(model)));
    }
});


var MainView = new mainView;