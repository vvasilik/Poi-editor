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
        this.createRoute();
        this.listenTo(this.model, "change", this.render, this);
        this.listenTo(this.model, "destroy", this.destroyView, this);
        this.listenTo(this.model, "openEdit", this.startAnimation, this);
        this.listenTo(this.model, "closeEdit", this.finishAnimation, this);
        this.listenTo(this.model, "mouseover", this.mouseover, this);
        this.listenTo(this.model, "mouseout", this.mouseout, this);
        this.listenTo(this.model, "updateRoute", this.updateRoute, this);
        this.listenTo(this.model, "destroyRoute", this.destroyRoute, this);
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

    createRoute: function () {
        this.route = {};
        this.polyline = {};
        this.route.rendererOptions = {
            draggable: true,
            preserveViewport: true
        };
        this.route.directionsDisplay = new google.maps.DirectionsRenderer(this.route.rendererOptions);
        this.route.directionsService = new google.maps.DirectionsService();

        this.route.directionsDisplay.setOptions( { suppressMarkers: true } );

        this.updateRoute(false)
    },

    updateRoute: function (finalPosition) {

        if (!finalPosition) {
            finalPosition = [this.model.get('positionLat'), this.model.get('positionLng')]
        } else {
            this.route.directionsDisplay.setMap(null);
            if (!$.isEmptyObject(this.polyline)) {
                this.polyline.setMap(null);
            }
        }

        this.route.request = {
            origin: new google.maps.LatLng(this.model.get('positionLat'), this.model.get('positionLng')),
            destination: new google.maps.LatLng(finalPosition[0], finalPosition[1]),
            travelMode: google.maps.TravelMode.DRIVING
        };


        var routeSetMap = $.proxy(function () {
            this.route.directionsService.route(this.route.request, $.proxy(function (response, status) {
                if (status == google.maps.DirectionsStatus.OK) {
                    this.route.directionsDisplay.setDirections(response);
                    this.route.directionsDisplay.setMap(map);
                } else if (status == google.maps.DirectionsStatus.ZERO_RESULTS){
                    var flightPlanCoordinates = [
                        new google.maps.LatLng(this.model.get('positionLat'), this.model.get('positionLng')),
                        new google.maps.LatLng(finalPosition[0], finalPosition[1])
                    ];
                    this.polyline = new google.maps.Polyline({
                        path: flightPlanCoordinates,
                        geodesic: true,
                        strokeColor: '#FF0000',
                        strokeOpacity: 1.0,
                        strokeWeight: 4
                    });

                    this.polyline.setMap(map);
                } else if (status == 'OVER_QUERY_LIMIT') {
                    _.delay(routeSetMap, 500)
                }
            }, this));
        }, this)
        var startQueryCicleToGoogle = _.once(routeSetMap);
        startQueryCicleToGoogle()
    },

    editPoi: function () {
        this.model.trigger('openEdit');
    },

    mouseover: function () {
        this.marker.set('icon', 'http://maps.google.com/mapfiles/ms/icons/green-dot.png');
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
        this.infoWindow.setContent(this.template(this.model));
    },

    destroyView: function(){
        this.marker.setMap(null);
        if (!$.isEmptyObject(this.polyline)) {
            this.polyline.setMap(null);
        }
        this.route.directionsDisplay.setMap(null);
    },

    destroyRoute: function () {
        if (!$.isEmptyObject(this.polyline)) {
            this.polyline.setMap(null);
        }
        this.route.directionsDisplay.setMap(null);
    }
});



//представление Poi в списке
var poiListView = Backbone.View.extend({

    tagName: 'li',
    className: 'b-poi__list__frame',
    template: _.template($('#poi-list__template').html()),

    events:{
        'click .b-edit': 'openEditor',
        'mouseover': 'isHovered',
        'mouseout': 'isNoHovered',
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

    isHovered: function () {
        this.model.trigger('mouseover')
    },

    isNoHovered: function () {
        this.model.trigger('mouseout')
    },

    destroy: function(){
        if (confirm('Удалить точку?')) {
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
        if (confirm('Удалить точку?')) {
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
        this.listenTo(this.model, "change:imageSrc", this.render, this);
    },

    bindEvents: function(){
        $('.b-saveEdit').on('click', $.proxy(this.saveModel, this));
        $('.b-deletePoi').on('click', $.proxy(this.destroy, this));
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

    destroy: function(){
        if (confirm('Удалить точку?')) {
            this.model.destroy();
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
        "click .js-poi__list__create__link": 'createLink',
        "click .js-add__share": 'addShare',
        "click .js-poi__list__delete__all": 'deleteAllModels'
    },

    initialize: function () {
        this.modelNum = 0;
        this.createMap();
        this.listenTo(PoiAppCollection, 'add', this.addOne);
        this.listenTo(PoiAppCollection, 'change', this.updateRoute);
        this.listenTo(PoiAppCollection, 'destroy', this.destroyRoute);
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

    createLink: function () {
        var lockalStorageLink = {};
        lockalStorageLink.Main = localStorage.getItem('PoiEditor');
        for (var i=0; i<lockalStorageLink.Main.split(',').length; i++) {
            lockalStorageLink[i] = localStorage.getItem('PoiEditor-' + i);
        }
        this.$el.find('.js-poi__list__share').text(JSON.stringify(lockalStorageLink));
    },

    addShare: function () {
        var addedShare = prompt("Введите текст - текущие точки будут утеряны");
        if (addedShare) {
            try {
                var lockalStorageLink = JSON.parse(addedShare);
                localStorage.clear();
                localStorage.setItem('PoiEditor', lockalStorageLink.Main);
                for (var i = 0; i < lockalStorageLink.Main.split(',').length; i++) {
                    localStorage.setItem('PoiEditor-' + i, lockalStorageLink[i]);
                }
                location.reload();
            }
            catch(e) {
                alert('Ошибка! Проверьте правильность введенных данных')
            }
        }

    },

    countId: function () {
        if (!PoiAppCollection.length) {
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

    updateRoute: function (model) {
        var modelsNumList = [];
        var nextModelPosition = [];

        //обновление предыдущего роута
        if (model.number) {
            PoiAppCollection.each(function (item) {
                if (item.number === model.number - 1){
                    item.trigger('updateRoute', [model.get('positionLat'), model.get('positionLng')])
                }
            });
        }

        //обновление текущего роута
        PoiAppCollection.each(function (item) {
            modelsNumList.push(item.number);
        });
        PoiAppCollection.each(function (item) {
            if (item.number === model.number + 1){
                nextModelPosition = [item.get('positionLat'), item.get('positionLng')]
            }
        });
        PoiAppCollection.each(function (item) {
            if (item.number === model.number){
                item.trigger('updateRoute', nextModelPosition)
            }
        });
    },

    destroyRoute: function (model) {
        var self = this;
        var prevModelId = {};
        if (model.number === PoiAppCollection.length) {
            PoiAppCollection.each(function (item) {
                if (item.number === model.number - 1) {
                    prevModelId = item.id;
                }
            });
            if (PoiAppCollection.length) {
                PoiAppCollection.get(prevModelId).trigger('destroyRoute');
            }
        } else if (model.number === 0) {
            PoiAppCollection.each(function (item) {
                item.number = item.number - 1;
            });
        } else {
            PoiAppCollection.each(function (item) {
                if (item.number > model.number){
                    item.number = item.number - 1;
                } else if (item.number === model.number - 1) {
                    prevModelId = item.id;
                }
            });
            this.updateRoute(PoiAppCollection.get(prevModelId));
        }
        this.modelNum = this.modelNum - 1;
    },

    addOne: function (model) {
        model.number = this.modelNum++;
        var PoiMapView = new poiMapView({model: model});
        var PoiEditorView = new poiEditorView({model: model});
        var PoiListView = new poiListView({model: model});
        var PoiImagesView = new poiImagesView({model: model});
        $('.b-poi__list').append(PoiListView.$el.html(PoiListView.template(model)));
        $('.b-poi__images').append(PoiImagesView.$el.html(PoiImagesView.template(model)));
        this.updateRoute(model);
    },

    deleteAllModels: function () {
        if (!PoiAppCollection.length) {
            alert("Нечего удалять")
        } else if (confirm('Вы увернены, что хотите удалить все точки?')) {
            while(model = PoiAppCollection.first()){
                model.destroy();
            }
            localStorage.clear();
        }
    }
});


var MainView = new mainView;