import {fabric} from 'fabric-browseronly';
//
import {module as mod} from './linePositionMapper';
/**
 * 
 */

const DtxChart = (function(mod){
    
    //Check if fabric.js has been loaded
    if(!fabric){
        console.error("fabric.js not found! Please load fabric.js before loading DtxChart.ChartEngine module");
        return mod;
    }

    //let drumsChipImageSet = {};
    //CanvasEngine act as abstract interface to the actual canvas library
    
    /**
     * canvasConfig:
     *    pages - Number of pages in this canvas
     *    width - The full width of canvas
     *    height - The full height of canvas
     *    elementId - The id of the html5 canvas element
     *    backgroundColor - Color string of background color of canvas
     */
    function createCanvas(canvasConfig){
        //TODO: Handle thrown exceptions when elementID is invalid
        let canvas = null;
        try {
            canvas = new fabric.StaticCanvas( canvasConfig.elementId, 
            {
				backgroundColor: canvasConfig.backgroundColor,
				height: canvasConfig.height,
				width: canvasConfig.width,
				renderOnAddRemove: false
			});
        } catch (error) {
            //console.error("CanvasEngine error: ", error);
            throw new Error("Invalid <canvas> element. CanvasEngine fail to create canvasObject");
        }

        return canvas;
    }

    function addChip(positionSize, drawOptions, imgObject){
        let rect = null;
        if(imgObject){
            rect = new fabric.Rect({
                fill: drawOptions.fill,
                width: imgObject.width,
                height: imgObject.height,
                left: positionSize.x,
                top: positionSize.y,
                originY: 'center'
			});
            rect.setPatternFill({
                source: imgObject,
                repeat: 'no-repeat'
            });            
        }
        else {
            rect = new fabric.Rect({
                fill: drawOptions.fill,
                width: positionSize.width,
                height: positionSize.height,
                left: positionSize.x,
                top: positionSize.y,
                originY: 'center'
			});
        }
        this._canvasObject.add(rect);
    }

    function addRectangle(positionSize, drawOptions){
        const rect = new fabric.Rect({
              fill: drawOptions.fill,
              opacity: drawOptions.opacity,
              originY: drawOptions.originY,
              width: positionSize.width,
              height: positionSize.height,
              left: positionSize.x,
              top: positionSize.y
			});

        this._canvasObject.add(rect);
    }

    function addLine(positionSize, drawOptions){
        
        const line = new fabric.Line([
            positionSize.x, 
            positionSize.y, 
            positionSize.x + positionSize.width, 
            positionSize.y + positionSize.height
        ],{
            stroke: drawOptions.stroke,
            strokeWidth: drawOptions.strokeWidth
        });

        this._canvasObject.add(line);
        
    }

    function addText(positionSize, text, textOptions){
        /**
         * "BARNUM":new fabric.Text('000',{
				// backgroundColor: 'black',
				fill: '#ffffff',
				fontSize: 16,
				originY: 'center'
         */

        const textObject = new fabric.Text(text, {
            left: positionSize.x,
            top: positionSize.y,
            fill: textOptions.fill ? textOptions.fill : "#ffffff",
            fontSize: textOptions.fontSize ? textOptions.fontSize : 20,
            fontWeight: textOptions.fontWeight ? textOptions.fontWeight : "",
            fontFamily: textOptions.fontFamily ? textOptions.fontFamily : "Times New Roman",
            originY: textOptions.originY ? textOptions.originY : "center",
            originX: textOptions.originX ? textOptions.originX : "left"
        });

        const currTextWidth = textObject.width;
        if(positionSize.width && currTextWidth >  positionSize.width){
            textObject.scaleToWidth(positionSize.width); //positionSize.width/currTextWidth required for laptop browser but why? Scale becomes relative??? Behaviour different from jsfiddle...
        }

        this._canvasObject.add(textObject);
    }

    //Clears the canvas of all note chart information and resets the background color
    function clear(){
        const bgColor = this._canvasObject.backgroundColor;
        this._canvasObject.clear();
        this._canvasObject.setBackgroundColor(bgColor, this._canvasObject.renderAll.bind(this._canvasObject));
        //TODO: May still need to call renderAll

    }

    function update(){
        this._canvasObject.renderAll();
    }

    function setZoom(factor){
        this._canvasObject.setZoom(factor);
    }

    function loadChipImageAssets(url, laneLabel){
        let self = this;
        const promise = new Promise(function(resolve){
            fabric.util.loadImage(url, function (img) {            
                self[laneLabel] = img;
                //console.log(img);
                resolve(true);           
            });
        });
        return promise;
    }
   //
    mod.CanvasEngine = {
        loadChipImageAssets: loadChipImageAssets,
        createCanvas: createCanvas,
        addChip: addChip,
        addRectangle: addRectangle,
        addLine: addLine,
        addText: addText,
        setZoom: setZoom,
        clear: clear,
        update: update
    };

    //
    return mod;
}( mod || {} ));

//
export const module = {
    ...DtxChart
}