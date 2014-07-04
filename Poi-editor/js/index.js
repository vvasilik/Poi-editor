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
        this.listenTo(this.model, "openEdit", this.startAnimation, this);
        this.listenTo(this.model, "closeEdit", this.finishAnimation, this);
        this.listenTo(this.model, "mouseover", this.mouseover, this);
        this.listenTo(this.model, "mouseout", this.mouseout, this);
    },

    bindEvents: function () {
        $('.b-poi__edit').on('click', $.proxy(this.editPoi, this))
    },

    createMarker: function () {
        this.marker = new google.maps.Marker({
            position: new google.maps.LatLng(this.model.get('positionLat'), this.model.get('positionLng')),
            map: map,
            animation: google.maps.Animation.DROP,
            icon: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
            draggable: true
        });

        var openInfoWondow = $.proxy(function () {
            this.infoWindow.open(map,this.marker);
            this.bindEvents();
        }, this);

        var saveDragendMarker = $.proxy(function (event) {
            this.model.set({
                positionLat: event.latLng.lat(),
                positionLng: event.latLng.lng()
            });
        }, this);

        var closeEditPoi = $.proxy(function () {
            this.model.trigger('closeEdit');
        }, this);

        this.infoWindow = new google.maps.InfoWindow({
            content: this.template(this.model)
        });

        google.maps.event.addListener(this.marker, 'click', openInfoWondow);
        google.maps.event.addListener(this.marker, 'dragend', saveDragendMarker);
        google.maps.event.addListener(this.infoWindow,'closeclick', closeEditPoi);
    },

    editPoi: function () {
        this.model.trigger('openEdit');
    },

    mouseover: function () {
        this.marker.set('icon', 'http://maps.google.com/mapfiles/ms/icons/green-dot.png')
        map.panTo(new google.maps.LatLng(this.model.get('positionLat'), this.model.get('positionLng')));
    },

    mouseout: function () {
        this.marker.set('icon', 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png')
    },

    startAnimation: function () {
        this.marker.setAnimation(google.maps.Animation.BOUNCE);
        map.panTo(new google.maps.LatLng(this.model.get('positionLat'), this.model.get('positionLng')));
    },

    finishAnimation: function () {
        this.marker.setAnimation(null);
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
        this.listenTo(this.model, "openEdit", this.startAnimation, this);
        this.listenTo(this.model, "closeEdit", this.finishAnimation, this);
    },

    startAnimation: function () {
        this.$el.addClass('animate')
    },

    finishAnimation: function () {
        this.$el.removeClass('animate')
    },

    destroy: function(){
        if(confirm('Удалить точку?')) {
            this.model.destroy();
        }
    },

    destroyView: function(){
        this.$el.remove();
    },

    render: function(){
        this.$el.html(this.template(this.model));
    },

    openEditor: function(){
        this.model.trigger('openEdit')
    }
});


//представление картинок Poi
var poiImagesView = Backbone.View.extend({

    tagName: 'li',
    className: 'b-poi__images__frame',
    template: _.template($('#poi-images__template').html()),

    events:{
        'click': 'setOpenEditActive',
        'dblclick': 'destroy',
        'mouseenter': 'isHovered',
        'mouseleave': 'isNoHovered'
    },

    initialize: function(){
        this.listenTo(this.model, "change", this.render, this);
        this.listenTo(this.model, "destroy", this.destroyView, this);
        this.listenTo(this.model, "openEdit", this.startAnimation, this);
        this.listenTo(this.model, "closeEdit", this.finishAnimation, this);
    },

    isHovered: function () {
        this.model.trigger('mouseover')
    },

    isNoHovered: function () {
        this.model.trigger('mouseout')
    },

    startAnimation: function () {
        this.$el.addClass('animate')
    },

    finishAnimation: function () {
        this.$el.removeClass('animate')
    },

    setOpenEditActive: function () {
        this.model.trigger('openEdit')
    },

    destroyView: function(){
        this.$el.remove();
    },

    render: function(){
            this.$el.html(this.template(this.model));
    },

    destroy: function(){
        if(confirm('Удалить точку?')) {
            this.model.destroy();
        }
    }
});



//представление Poi в окне редактирования
var poiEditorView = Backbone.View.extend({
    tagName: 'div',
    className: 'b-poi-editor',
    template: _.template($('#poi-editor__template').html()),

    initialize: function(){
        this.listenTo(this.model, "openEdit", this.render, this);
        this.listenTo(this.model, "closeEdit", this.closeEditor, this);
        this.listenTo(this.model, "destroy", this.closeEditorWithModelEvent, this);
        this.listenTo(this.model, "change", this.render, this);
    },

    bindEvents: function(){
        $('.b-saveEdit').on('click', $.proxy(this.saveModel, this));
        $('.b-closeEdit').on('click', $.proxy(this.closeEditorWithModelEvent, this));
        $('#input-file').on('change', $.proxy(this.addImage, this));
    },

    addImage: function () {
        var self = this;
        if (document.getElementById('input-file').files[0]) {
            var reader = new FileReader();
            reader.readAsDataURL(document.getElementById('input-file').files[0]);
            reader.onload = function (e) {
                self.model.set({ imageSrc: e.target.result });
            };
        }
    },

    render: function(){
        this.$el.remove();
        $('.b-poi__list__holder').append(this.$el.html(this.template(this.model)));
        this.bindEvents();
    },

    closeEditorWithModelEvent: function(){
        this.model.trigger('closeEdit');
        this.$el.remove();
    },

    closeEditor: function(){
        this.$el.remove();
    },

    saveModel: function(){
        this.model.save({
            title: this.$el.find('.edit__title').val(),
            description: this.$el.find('.edit__description').val()
        });
        this.closeEditorWithModelEvent();
    }
});



//коллекция Poi
var poiAppCollection = Backbone.Collection.extend({
    model: poiModel,
    localStorage: new Backbone.LocalStorage("PoiEditor")
});

var PoiAppCollection = new poiAppCollection;



//основная View
var mainView = Backbone.View.extend({
    el: '.h-wrapper',
    events:{
        "click .js-toggle__editor": 'listenMapClick',
        "click .js-cancel__add": 'stopListenMapClick',
        "click .js-random": 'createRandom',
        "click .js-poi__list__delete__all": 'deleteAllModels'
    },

    initialize: function () {
        PoiAppCollection.markersList = [];
        this.createMap();
        this.listenTo(PoiAppCollection, 'add', this.addOne);
        PoiAppCollection.fetch();
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
        map.set('draggableCursor', 'crosshair');
    },

    stopListenMapClick: function(){
        google.maps.event.removeListener(this.listener);
        map.set('draggableCursor', null)
    },

    countId: function () {
        if(!PoiAppCollection.length) {
            this.counter = 0;
        } else {
            this.counter = _.max(PoiAppCollection.pluck('id')) + 1 || 0;
        }
    },

    createNewModel: function (event) {
        PoiAppCollection.create({
            positionLat: event.lat(),
            positionLng: event.lng(),
            title: 'New POI ' + this.counter,
            id: this.counter
        });
        this.counter++;
    },

    addOne: function (model) {
        var PoiMapView = new poiMapView({model: model});
        var PoiEditorView = new poiEditorView({model: model});
        var PoiListView = new poiListView({model: model});
        var PoiImagesView = new poiImagesView({model: model});
        $('.b-poi__list').append(PoiListView.$el.html(PoiListView.template(model)));
        $('.b-poi__images').append(PoiImagesView.$el.html(PoiImagesView.template(model)));
    },

    createRandom: function () {
        var randomPoisNumber = prompt('Сколько точек добавить?', 10);
        if(randomPoisNumber > 1000) randomPoisNumber = 1000;
        for(var i=0; i<randomPoisNumber; i++){
            PoiAppCollection.create({
                positionLat: (Math.random()-0.5)*180,
                positionLng: (Math.random()-0.5)*360,
                title: 'New POI ' + this.counter,
                id: this.counter
            });
            this.counter++;
        }
    },

    deleteAllModels: function () {
        if(!PoiAppCollection.length) {
            alert("Нечего удалять")
        } else if(confirm('Вы увернены, что хотите удалить все точки?')) {
            while(model = PoiAppCollection.first()){
                model.destroy();
            }
        }
    }
});


var MainView = new mainView;