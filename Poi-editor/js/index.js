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