otp.namespace("otp.planner.poi");

/**
 * A class for creating a layer for displaying GeoCodeded POIs.
 * 
 * Implements: 
 *  - OpenLayers.Layer.Vector
 */
otp.planner.poi.Control = {

    name         : 'POI Layer',
    layer        : null,
    drag         : null,
    map          : null,
    styleMap     : null,
    visibility   : false,
    width        : 250,  // popup width

    m_control    : null,
    m_popup      : null,
    m_highlight  : null,
    m_fromTrip   : null,
    m_toTrip     : null,
    m_features   : [],

    initialize: function(config)
    {
        console.log("enter poi.Control");

        // step 1: configure 
        this.styleMap = otp.util.OpenLayersUtils.makeDefaultPointFeatureStyle();
        otp.configure(this, config);

        // step 2: make layer
        this.layer = new OpenLayers.Layer.Vector(this.name);
        this.drag  = new OpenLayers.Control.DragFeature(this.layer);

        this.map.addLayer(this.layer);
        this.map.addControl(this.drag);

        // step 3: feature click controller
        this.layer.events.on({
            "featuresremoved":   this.destroyPopup,
            "featureselected":   this.clickFeature,
            "featureunselected": this.clickoutFeature,
            scope: this
        });

        this.drag.onComplete = this.onComplete;

        console.log("exit poi.Control");
    },

    /** */
    getLayer : function()
    {
        return this.layer;
    },

    /** */
    clickoutFeature: function(selection)
    {
        this.destroyPopup();
    },

    clickFeature: function(s)
    {
        try
        {
            this.m_highlight = s.feature;
            this.popup(s.feature.attributes.m_text);
        }
        catch(e)
        {
            console.log("EXCEPTION clickFeature: " + e);
        }
    },

    destroyPopup: function()
    {
        try
        {
            if(this.m_popup)
                this.m_popup.destroy();
            this.m_popup = null;
        }
        catch(e)
        {
            console.log("EXCEPTION destoryPopup: " + e);
        }
    },

    /** */
    onComplete : function(f, px)
    {
        try
        {
            var ll = otp.util.OpenLayersUtils.getLatLonOfPixel(this.map, px.x, px.y);
            f.attributes.m_text = ll.lon + "," + ll.lat
            if(f.attributes.m_to)
                otp.planner.StaticForms.setTo(f.attributes.m_text, ll.lon, ll.lat, true, true);
            if(f.attributes.m_from)
                otp.planner.StaticForms.setFrom(f.attributes.m_text, ll.lon, ll.lat, true, true);
        }
        catch(e)
        {
            console.log("EXCEPTION onComplete: " + e);
        }
    },

    /** */
    highlight : function(x, y, zoom, text, trustedText)
    {
        if(x == null || y == null) return;
        if(trustedText == null) trustedText = "";

        this.drag.deactivate();

        this._destroyFeature(this.m_highlight);
        this.m_highlight = this.makeFeature(x, y, {index:0});
        this.popup(text, trustedText + otp.util.OpenLayersUtils.makeZoomLink());
        this.show();
        otp.util.OpenLayersUtils.setCenter(this.map, x, y, zoom);
    },

    /** */
    setFrom : function(x, y, text, move)
    {
        if(x == null || y == null) return;
        this._destroyFeature(this.m_fromTrip);
        this.m_fromTrip = this.makeFeature(x, y, {m_from:true,m_text:text}, otp.planner.poi.Style.fromTrip);
        this.show();
        if(move) otp.util.OpenLayersUtils.setCenter(this.map, x, y);
        this.drag.activate();
    },

    /** */
    setTo : function(x, y, text, move)
    {
        if(x == null || y == null) return;
        this._destroyFeature(this.m_toTrip);
        this.m_toTrip = this.makeFeature(x, y, {m_to:true,m_text:text}, otp.planner.poi.Style.toTrip);
        this.show();
        if(move) otp.util.OpenLayersUtils.setCenter(this.map, x, y);
        this.drag.activate();
    },

    /** */
    clearTrip : function()
    {
        this._destroyFeature(this.m_toTrip);
        this._destroyFeature(this.m_fromTrip);
    },

    /** */
    clear : function()
    {
        this._destroyFeatures(this.m_features);
        this.m_features = new Array();
        this.hide();
        this.drag.deactivate();
    },

    /** */
    hide : function()
    {
        this.layer.setVisibility(false);
    },

    /** */
    show : function()
    {
        this.layer.setVisibility(true);
    },

    /** */
    popup : function(text, trustedText)
    {
        // kill any old popup
        this.destroyPopup();
        this.m_popup = this.makePopup(this.m_highlight, {}, text, trustedText);
        //this.map.addPopup(this.m_popup);
    },

    /** */
    makeFeature : function(x, y, params, style)
    {
        var retVal = new OpenLayers.Feature.Vector(
                new OpenLayers.Geometry.Point(x, y), 
                params,
                style
        );
        this.layer.addFeatures([retVal]);
        this.m_features.push(retVal);
        this.show();

        return retVal;
    },

    /**
     * note, this routine creates a Stop popup by default.
     * this method can be overwritten in StopInfo config to allow other popup types 
     *
     * @param {Object} feature
     */
    makePopup : function(feature, config, text, trustedText)
    {
        if(trustedText == null)
        {
            trustedText = "";
            if(feature.attributes.m_trustedText)
                trustedText = feature.attributes.m_trustedText;
        }
        if(text == null)
        {
            text = "";
            if(feature.attributes.m_text)
                text = feature.attributes.m_text;
        }

        //text = otp.util.StringUtils.clean(text);
        feature.attributes.m_text = text;
        feature.attributes.m_trustedText = trustedText;

        var popup = new GeoExt.Popup({
            title       : text,
            ctCls       : 'stop-pop',
            feature     : feature,
            width       : this.width,
            height      : this.height,
            html        : '<div class="poi-popup">' + text + " " + trustedText + '</div>',
            collapsible : false,
            autoDestory : false,
            autoScroll  : true,
            unpinnable  : false,
            shadow      : true
        });

        // HACK: catch some stupid bug
        if(popup.draw == undefined)
        {
            popup.draw = function(p,q,r){
                var z = p;
            };
        }

        popup.show();
        popup.doLayout();
        popup.doLayout();

        return popup;
    },

    /** */
    OLDmakePopup : function(feature, config, text, trustedText)
    {
        if(trustedText == null)
            trustedText = "";
        if(text == null)
            text = feature.attributes.m_text;
            
        //text = trimet.utils.StringUtils.clean(text);
        feature.attributes.m_text = text;
        return new otp.planner.poi.Popup(feature, config, text + ' ' + trustedText);
    },

    /** */
    _destroyFeature : function(feature)
    {
        if(feature == null) return;

        // step 1: remove this feature from the feature cache
        var tmp = new Array();
        var f   = this.m_features;
        for(var i in f)
        {
            if(feature != f[i])
            {
                tmp.push(this.m_features[i]);
            }
        }
        this.m_features = tmp;
        
        // step 2: remove this feature from the vector layer
        this._destroyFeatures([feature]);
    },

    /** */
    _destroyFeatures : function(features)
    {
        try
        {
            this.destroyPopup();
        }
        catch(exp)
        {
        }
        try
        {
            if(features)
                this.layer.destroyFeatures(features);
        }
        catch(exp)
        {
        }
    },

    CLASS_NAME: "otp.planner.poi.Control"
};

otp.planner.poi.Control   = new otp.Class(otp.planner.poi.Control);