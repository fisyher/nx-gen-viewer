import { module as mod } from "./graph";

/**
 * 
 */

const DtxChart = (function(mod){

    const ChartSheet = mod.ChartSheet;
    if(!ChartSheet){
        console.error("ChartSheet not loaded into DtxChart module! DtxChart.Charter depends on DtxChart.ChartSheet");
    }

    const Parser = mod.Parser;//Parser needs to be loaded first
    if(!Parser){
        console.warn("DtxChart.Parser should be loaded first");
    }

    const DEFAULT_SCALE = 1.0;
    const MIN_SCALE = 0.5;
    const MAX_SCALE = 3.0;

    const DEFAULT_PAGE_HEIGHT = 720;
    const MIN_PAGE_HEIGHT = 480;
    const MAX_PAGE_HEIGHT = 3840;

    const DEFAULT_PAGEPERCANVAS = 20;
    const MIN_PAGEPERCANVAS = 6;
    const MAX_PAGEPERCANVAS = 110;

    const BEAT_LINE_GAP = 48;//192/4

    //A collection of width/height constants for positioning purposes. Refer to diagram for details 
    const DtxChartCanvasMargins = {
        "A": 58,//Info section height
        "B": 2,//Top margin of page//31
        "C": 3,//Left margin of each canvas
        "D": 3,//Right margin of each canvas
        "E": 40,//Bottom margin of page
        "F": 0,//Right margin of each page (Except the last page for each canvas)
        "G": 12,//Top/Bottom margin of Last/First line from the top/bottom border of each page
        "H": 2, //Bottom Margin height of Sheet Number text from the bottom edge of canvas
        "I": 150, //Title and Artist X-offset from left
    };    

    const DtxFillColor = {
        "Background": "#000000",
        "ChartInfo":"#221e1a",
        "PageFill": "#221e1a"
    };

    //Difficulty Mode Color: "#a900ff" "#ed1c24" "#beaf02" "#5297ff"

    const DtxBarLineColor = {
        "BarLine": "#707070",
        "QuarterLine": "#4b4c4a",
        "EndLine": "#ff0000",
        "StartLine":"#00ff00",
        "TitleLine": "#707070",
        "BorderLine": "#707070",
        "BPMMarkerLine": "#eeffab"
    };

    const DtxTextColor = {
        "BarNumber": "#ffffff",
        "BpmMarker": "#ffffff",
        "ChartInfo": "#ffffff",
        "PageNumber": "#ffffff"
    };   

    const DtxFontSizes = {
        "BarNumber": 24,
        "BpmMarker": 14,
        "Title": 30,
        "Artist": 16,
        "ChartInfo": 24,
        "PageNumber": 18
    };

    /** 
     * Constructor of Charter
     * 
    */
    function Charter(){
        this._dtxdata = null;
        this._positionMapper = null;
        this._pageList = null;
        //
        this._scale = DEFAULT_SCALE;
        this._pageHeight = DEFAULT_PAGE_HEIGHT;
        this._pagePerCanvas = DEFAULT_PAGEPERCANVAS;

        this._chartSheets = [];
        this._pageCount = 0;
        //this._heightPerCanvas = 0;
        this._barAligned = false;
        this._chartType = "full";
        this._mode = null;
        this._difficultyTier = null;
        this._DTXDrawParameters = {};
        this._direction = "up";
    }

    /**
     * Parameters:
     * dtxData - DtxDataObject type
     * positionMapper - LinePositionMapper type
     */
    Charter.prototype.setDtxData = function(dtxData, positionMapper){
        this._dtxdata = dtxData;
        this._positionMapper = positionMapper;
    }

    /**
     * Parameters:
     * config - An object consist of following options:
     *   scale (Number): The vertical scaling factor for each page. Min value accepted is 1.0 and Max is 3.0. Default is 1.0
     *   pageHeight (Number): The height for each page in pixels. Min is 960 pixel, Max is 3840, Default is 1920 pixel
     *   pagePerCanvas (Number): The number of pages to be rendered per canvas element. Min 4 pages and max 20
     *   chartType {String}: Type of chart to draw. Valid options are "full", "Gitadora", "Vmix". Defaults to "full"
     *   mode {String}: "drum", "bass", "guitar"
     *   barAligned (bool): true if all pages are drawn with only full bars in it.
     *   direction (String): Direction in which bar numbers are increasing. Valid options are "up" (DM style) and "down" (GF style). Defaults to "up"
     *   drawParameters (Object): DrawParameters object
     *   drawNoteFunction (function): Draw Note function that takes in 4 arguments: laneLabel, chartSheet, pixSheetPos, drawParameters
     */
    Charter.prototype.setConfig = function(config){
        //
        this._scale = limit(typeof config.scale === "number" ? config.scale : DEFAULT_SCALE, MIN_SCALE, MAX_SCALE);
        this._pageHeight = limit(typeof config.pageHeight === "number" ? config.pageHeight : DEFAULT_PAGE_HEIGHT, MIN_PAGE_HEIGHT, MAX_PAGE_HEIGHT);
        this._pagePerCanvas = limit(typeof config.pagePerCanvas === "number" ? config.pagePerCanvas : DEFAULT_PAGEPERCANVAS, MIN_PAGEPERCANVAS, MAX_PAGEPERCANVAS);

        this._barAligned = config.barAligned === undefined ? false : config.barAligned;
        if(this._barAligned)
        {
            this._pageList = this._computeBarAlignedPositions();
            //console.log(this._pageList);
        }

        this._direction = config.direction === undefined ? "up" : config.direction;

        this._chartType = config.chartType? config.chartType : "full";//full, Gitadora, Vmix
        this._mode = config.mode;//
        this._difficultyTier = config.difficultyTier;
        this._DTXDrawParameters = config.drawParameters;//config.createDrawParameters(this._chartType);
        this._drawNoteFunction = config.drawNoteFunction;
    }

    Charter.prototype.clearDTXChart = function(){
        //
        for(const i in this._chartSheets){
            this._chartSheets[i].clear();
        }

        //this._chartSheets = [];
        this._pageCount = 0;
        //this._heightPerCanvas = 0;
        this._barAligned = false;
        this._chartType = "full";
        this._mode = null;
        this._difficultyTier = null;
        this._DTXDrawParameters = {};

        this._pageList = null;
        this._direction = "up";
    };

    /**
     * Method: DtxChart.Charter.canvasRequired
     * Parameters: None
     * Description: 
     * Charter will calculate the number of canvas, the width/height and pages in each canvas required to draw all bars in the loaded dtxData.
     * and return an array of canvasConfig objects for the calling object to dynamically creat <canvas> elements based on provided information.
     * Returns: A canvasConfigArray object, which is an array of canvasConfig object
     *      pages - The number of pages in each canvas 
            width - Canvas width
            height - Canvas height
            backgroundColor - Default is black
            elementId - The suggested elementID which takes the form of "dtxdrumchart_0", "dtxdrumchart_1", "dtxdrumchart_2"... 
     */
    Charter.prototype.canvasRequired = function(){
        //Calculate the canvas required, including the width height of each canvas and number of pages per canvas

        //Find total number of pages required
        const chartLength = this._positionMapper.chartLength();
        const requiredPageCount = this._barAligned ? this._pageList.length : Math.ceil((chartLength * this._scale) / this._pageHeight);
        this._pageCount = requiredPageCount;

        const canvasCount = Math.ceil(requiredPageCount / this._pagePerCanvas);
        const pageInLastCanvas = requiredPageCount % this._pagePerCanvas;

        //Height required for all canvas
        let heightPerCanvas = this._pageHeight + DtxChartCanvasMargins.A + DtxChartCanvasMargins.B + DtxChartCanvasMargins.E + DtxChartCanvasMargins.G * 2;
        //this._heightPerCanvas = heightPerCanvas;

        //Width required for all canvas and last canvas
        const widthPerCanvas = DtxChartCanvasMargins.C + 
            (this._DTXDrawParameters.ChipHorizontalPositions.width + DtxChartCanvasMargins.F) * this._pagePerCanvas + DtxChartCanvasMargins.D;
        
        const canvasConfigArray = [];
        for(let i=0; i < canvasCount; ++i ){
            //The last canvas has less pages if pageInLastCanvas is not zero so width needs to be calculated again
            if(pageInLastCanvas !== 0 && i === canvasCount - 1){
                const widthFinalCanvas = DtxChartCanvasMargins.C + 
            (this._DTXDrawParameters.ChipHorizontalPositions.width + DtxChartCanvasMargins.F) * 
            (pageInLastCanvas < MIN_PAGEPERCANVAS ? MIN_PAGEPERCANVAS : pageInLastCanvas) + //The width cannot be less than 6 page wide even though the last sheet may contain less than 6 pages  
            DtxChartCanvasMargins.D;

                if(this._barAligned)
                {
                    //Find the max page height required for last sheet
                    const currCanvasPageList = this._pageList.slice( i*this._pagePerCanvas, this._pageList.length );
                    const maxPageHeightForCurrSheet = currCanvasPageList.reduce(function(prevItem, currItem){
                        return currItem.BAPageHeight >= prevItem.BAPageHeight ? currItem : prevItem;
                    }).BAPageHeight;

                    heightPerCanvas = maxPageHeightForCurrSheet + DtxChartCanvasMargins.A + DtxChartCanvasMargins.B + DtxChartCanvasMargins.E + DtxChartCanvasMargins.G * 2;
                }
                canvasConfigArray.push({
                    "pages": pageInLastCanvas,
                    //"pageHeight": this._pageHeight,
                    "width": widthFinalCanvas,
                    "height": heightPerCanvas,
                    "backgroundColor": DtxFillColor.Background,
                    "elementId": this._DTXDrawParameters.elementIDPrefix + "_" + i
                });
            }
            else{

                if(this._barAligned)
                {   //Find the max page height required for each sheet
                    const currCanvasPageList = this._pageList.slice( i*this._pagePerCanvas, (i+1)*this._pagePerCanvas );
                    const maxPageHeightForCurrSheet = currCanvasPageList.reduce(function(prevItem, currItem){
                        return currItem.BAPageHeight >= prevItem.BAPageHeight ? currItem : prevItem;
                    }).BAPageHeight;

                    heightPerCanvas = maxPageHeightForCurrSheet + DtxChartCanvasMargins.A + DtxChartCanvasMargins.B + DtxChartCanvasMargins.E + DtxChartCanvasMargins.G * 2;
                }

                canvasConfigArray.push({
                    "pages": this._pagePerCanvas,
                    //"pageHeight": this._pageHeight,
                    "width": widthPerCanvas,
                    "height": heightPerCanvas,
                    "backgroundColor": DtxFillColor.Background,
                    "elementId": this._DTXDrawParameters.elementIDPrefix + "_" + i
                });
            }
        }

        return canvasConfigArray;
    };

    Charter.prototype._computeBarAlignedPositions = function(){
        //
        const pageList = [];
        const barGroups = this._positionMapper.barGroups;
        const positionMapper = this._positionMapper;
        //const currPage = 0;
        let currAccumulatedHeight = 0;
        const pageHeightLimit = this._pageHeight;
        let maxAccumulatedHeight = 0;
        //First page always starts with bar 0
        pageList.push({
            "startBarIndex" : 0,
            "endBarIndex": null,
            "BAPageHeight": 0
        });

        for(let i=0; i < barGroups.length; ++i ){
            
            //Compute pixel height of current bar
            const currBarStartAbsPos = barGroups[i].absStartPos;
            const nextBarStartAbsPos = i === barGroups.length - 1 ? positionMapper.chartLength() : barGroups[i+1].absStartPos;   
            const pixelHeightOfCurrentBar = (nextBarStartAbsPos - currBarStartAbsPos) * this._scale;

            //Check end height for current bar to ensure it fit within page
            if(currAccumulatedHeight + pixelHeightOfCurrentBar <= pageHeightLimit){
                currAccumulatedHeight += pixelHeightOfCurrentBar;
            }
            else{
                //The current page has reached its max height so fill this data
                pageList[pageList.length - 1]["endBarIndex"] = i - 1;
                pageList[pageList.length - 1]["BAPageHeight"] = currAccumulatedHeight;

                //Find the max height of all pages at the end of this loop
                if(currAccumulatedHeight >  maxAccumulatedHeight){
                    maxAccumulatedHeight = currAccumulatedHeight;
                }

                //This bar will start on next page
                pageList.push({
                    "startBarIndex" : i
                });
                currAccumulatedHeight = 0;
                //We have to restart the analysis for this bar again on the next iteration
                --i;
            }

        }

        pageList[pageList.length - 1]["endBarIndex"] = barGroups.length - 1;
        //Last page takes the largest height value of all previous pages
        pageList[pageList.length - 1]["BAPageHeight"] = maxAccumulatedHeight;

        return pageList;

    };

    Charter.prototype.imageSetReadyPromise = function(){
        if(this._DTXDrawParameters.imageSet_promises){
            return Promise.all(this._DTXDrawParameters.imageSet_promises);
        }
        else{
            return Promise.resolve(false);
        }
    };

    /**
     * Parameters:
     * canvasConfigArray - An array of canvasConfig objects, one per canvas sheet in sequence:
     *    canvasConfig is an object with following information:
     *    pages - Number of pages in this canvas
     *    width - The full width of canvas
     *    height - The full height of canvas
     *    elementId - The id of the html5 canvas element. The caller must ensure the id is valid, otherwise this method will throw an error
     *    backgroundColor - Color string of background color of canvas
     * Remarks: 
     * If the number of sheets created does not match the required number, Charter will only render up to available number of sheets.
     */
    Charter.prototype.setCanvasArray = function(canvasConfigArray){
        this._chartSheets = [];//NOTE: Repeated calls may cause memory issues
        for(const i in canvasConfigArray){
            const chartSheet = new ChartSheet(canvasConfigArray[i]);
            if(!chartSheet){
                console.log("Sheet creation failed! Please ensure the id of a valid canvas element is used");
            }
            this._chartSheets.push(chartSheet);
        }        
    };

    Charter.prototype.drawDTXChart = function(){

        //iterate through barGroups
        const barGroups = this._dtxdata.barGroups;
        const chartInfo = this._dtxdata.chartInfo;
        const metadata = this._dtxdata.metadata[this._mode];
        const positionMapper = this._positionMapper;

        //Draw ChartInfo
        this.drawChartInfo(chartInfo, metadata ? metadata.totalNoteCount : 0);

        //Draw frames
        this.drawPageFrames();

        //Draw notes
        for(const i in barGroups){
            const index = parseInt(i);
            const barInfo = barGroups[i];
            const absPosBarInfo = positionMapper.barGroups[i];
            const lineCount = barInfo["lines"];

            //Draw BarLines and intermediate lines
            this.drawLinesInBar(lineCount, index);

            //Draw Bar Numbers
            this.drawBarNumber(index);

            //Draw BPM Markers
            for(const j in absPosBarInfo["bpmMarkerArray"]){
                this.drawBPMMarker( absPosBarInfo["bpmMarkerArray"][j]["absPos"], absPosBarInfo["bpmMarkerArray"][j]["bpm"].toFixed(2));
            } 

            //Draw chips
            for(const laneLabel in barInfo["notes"]){
                //Make use of utility functions in Parser to decode the line                                
                if(Object.prototype.hasOwnProperty.call(this._DTXDrawParameters.ChipHorizontalPositions, laneLabel)){
                    //Make use of utility functions in Parser to decode the line
                    const chipPosArray = Parser.utils.decodeBarLine( barInfo["notes"][laneLabel], lineCount );
                    this.drawChipsInBar(chipPosArray, laneLabel, index);
                }
            }

        }        

        //Draw Hold Notes (Guitar and Bass only)
        if(this._mode === "guitar"){
            this.drawHoldNotes(this._dtxdata.gHoldNotes);
        }
        else if(this._mode === "bass"){
            this.drawHoldNotes(this._dtxdata.bHoldNotes);
        }

        //Draw the start and end line
        this.drawChartLine(this._positionMapper.bgmStartAbsolutePosition(), {
            stroke: DtxBarLineColor.StartLine,
            strokeWidth: 3
        });

        this.drawChartLine(this._positionMapper.chartLength(), {
            stroke: DtxBarLineColor.EndLine,
            strokeWidth: 3
        });

        

        //Draw Chartsheet Number if there are more than 1 sheets used
        if(this._chartSheets.length > 1){
            for(const i in this._chartSheets){
                if(!this._chartSheets[i]){
                    console.log("Sheet unavailable! Unable to draw");
                    continue;
                }
                this.drawSheetNumber(parseInt(i), this._chartSheets.length);
            }
        }        

        //Update all canvas
        for(const i in this._chartSheets){
            this._chartSheets[i].update();
        }

    };

    Charter.prototype.drawPageFrames = function(){
        for(const i in this._chartSheets){
            if(!this._chartSheets[i]){
                console.log("Sheet unavailable! Unable to draw");
                continue;
            }
            const chartSheet = this._chartSheets[i];
            const sheetIndex = parseInt(i);

            //Iterate for each page, draw the frames
            const canvasWidthHeightPages = chartSheet.canvasWidthHeightPages();
            const pageCount = canvasWidthHeightPages.pages;
            const canvasHeight = canvasWidthHeightPages.height;
            let startPoint = 0;
            let directionMultiplier = 1.0;
            let edgeOffset = DtxChartCanvasMargins.A + DtxChartCanvasMargins.B;
            let originYRect = "top";
            if(this._direction === "up"){
                startPoint = canvasHeight;
                edgeOffset = DtxChartCanvasMargins.E;
                directionMultiplier = -1.0;
                originYRect = "bottom";
            } else if(this._direction === "down"){
                startPoint = 0;
                edgeOffset = DtxChartCanvasMargins.A + DtxChartCanvasMargins.B;
                directionMultiplier = 1.0;
                originYRect = "top";
            }
            
            for(let j = 0; j<pageCount; ++j){
                const pageStartXPos = DtxChartCanvasMargins.C + (this._DTXDrawParameters.ChipHorizontalPositions.width + DtxChartCanvasMargins.F) * j;
                //const lineWidth = this._DTXDrawParameters.ChipHorizontalPositions.RightBorder - this._DTXDrawParameters.ChipHorizontalPositions.LeftBorder;
                
                //
                let currPageHeight = this._pageHeight;
                let endPageBarLineRelPixHeight = 0;
                if(this._barAligned){
                    //Abs page index;
                    const pageAbsIndex = sheetIndex*this._pagePerCanvas + j;

                    //Draw End bar line for the last bar within each page
                    //const endPageBarLineAbsPos = pageAbsIndex === this._pageList.length - 1 ? this._positionMapper.chartLength() : this._positionMapper.barGroups[this._pageList[pageAbsIndex+1].startBarIndex].absStartPos; 
                    //const startPageBarLineAbsPos = this._positionMapper.barGroups[this._pageList[pageAbsIndex].startBarIndex].absStartPos;

                    //const endPageBarLineRelPixHeight = (endPageBarLineAbsPos - startPageBarLineAbsPos)*this._scale;
                    endPageBarLineRelPixHeight = this._pageList[pageAbsIndex].BAPageHeight;
                    currPageHeight = endPageBarLineRelPixHeight;
                }
                else{
                    currPageHeight = this._pageHeight;
                }

                //Draw Page Body
                chartSheet.addRectangle({x: pageStartXPos + this._DTXDrawParameters.ChipHorizontalPositions.LeftBorder,
                                    y: startPoint + directionMultiplier * edgeOffset,
                                    width: this._DTXDrawParameters.ChipHorizontalPositions.width - this._DTXDrawParameters.ChipHorizontalPositions.LeftBorder,
                                    height: currPageHeight + DtxChartCanvasMargins.G * 2
                                    }, {
                                        fill: DtxFillColor.PageFill,
                                        originY: originYRect
                                    });
                
                if(this._barAligned){                    

                    chartSheet.addLine({x: pageStartXPos + this._DTXDrawParameters.ChipHorizontalPositions.LeftBorder,
                                y: startPoint + directionMultiplier * (edgeOffset + DtxChartCanvasMargins.G + endPageBarLineRelPixHeight),
                                width: this._DTXDrawParameters.ChipHorizontalPositions.width - this._DTXDrawParameters.ChipHorizontalPositions.LeftBorder,
                                height: 0
                                }, {
                                    stroke: DtxBarLineColor.BarLine,
                                    strokeWidth: 2,
                                });

                } 
                
                //Draw Top Border Line
                chartSheet.addLine({x: pageStartXPos + this._DTXDrawParameters.ChipHorizontalPositions.LeftBorder,
                                y: startPoint + directionMultiplier * (edgeOffset + currPageHeight + DtxChartCanvasMargins.G * 2),
                                width: this._DTXDrawParameters.ChipHorizontalPositions.width - this._DTXDrawParameters.ChipHorizontalPositions.LeftBorder,
                                height: 0
                                }, {
                                    stroke: DtxBarLineColor.BorderLine,
                                    strokeWidth: 3,
                                });

                //Draw Bottom Border Line
                chartSheet.addLine({x: pageStartXPos + this._DTXDrawParameters.ChipHorizontalPositions.LeftBorder,
                                y: startPoint + directionMultiplier * edgeOffset,
                                width: this._DTXDrawParameters.ChipHorizontalPositions.width - this._DTXDrawParameters.ChipHorizontalPositions.LeftBorder,
                                height: 0
                                }, {
                                    stroke: DtxBarLineColor.BorderLine,
                                    strokeWidth: 3,
                                });
                //Draw Left Border Line
                chartSheet.addLine({x: pageStartXPos + this._DTXDrawParameters.ChipHorizontalPositions.LeftBorder,
                                y: startPoint + directionMultiplier * edgeOffset,
                                width: 0,
                                height: directionMultiplier * (currPageHeight + DtxChartCanvasMargins.G * 2)
                                }, {
                                    stroke: DtxBarLineColor.BorderLine,
                                    strokeWidth: 3,
                                });

                //Draw Inner Right Border Line
                chartSheet.addLine({x: pageStartXPos + this._DTXDrawParameters.ChipHorizontalPositions.RightBorder,
                                y: startPoint + directionMultiplier * edgeOffset,
                                width: 0,
                                height: directionMultiplier * (currPageHeight + DtxChartCanvasMargins.G * 2)
                                }, {
                                    stroke: DtxBarLineColor.BorderLine,
                                    strokeWidth: 3,
                                });

                //Draw Outer Right Border Line
                chartSheet.addLine({x: pageStartXPos + this._DTXDrawParameters.ChipHorizontalPositions.width,
                                y: startPoint + directionMultiplier * edgeOffset,
                                width: 0,
                                height: directionMultiplier * (currPageHeight + DtxChartCanvasMargins.G * 2)
                                }, {
                                    stroke: DtxBarLineColor.BorderLine,
                                    strokeWidth: 3,
                                });
            }

        }
    };

    Charter.prototype.drawSheetNumber = function(currentSheet, sheetCount){
        if(!this._chartSheets[currentSheet]){
                console.log("Sheet unavailable! Unable to draw");
                return;
            }

        const pageWidthHeight = this._chartSheets[currentSheet].canvasWidthHeightPages();
        const width = pageWidthHeight.width;
        const height = pageWidthHeight.height;

        const text = "Part " + (currentSheet + 1) + " of " + sheetCount;
        
        this._chartSheets[currentSheet].addText({
                            x: width - DtxChartCanvasMargins.D - 85,
                            y: height - DtxChartCanvasMargins.H, //
                            }, text, {
                            fill: DtxTextColor.PageNumber,
                            fontSize: DtxFontSizes.PageNumber,
                            fontFamily: "Arial",
                            originY: "bottom",
                            textAlign: "right"
                        });
    };

    Charter.prototype.drawChartInfo = function(chartInfo, totalNoteCount){
        
        const songLength = this._positionMapper.estimateSongDuration();

        const songMinutes = Math.floor(songLength/60) + "";
        let songSeconds = Math.round(songLength%60).toFixed(0);
        songSeconds = songSeconds < 10 ? "0" + songSeconds : "" + songSeconds;//Convert to string with fixed 2 characters

        const diffLevel = this._chartType === "Vmix" ? Math.floor(chartInfo[this._mode + "level"]*10).toFixed(0) : chartInfo[this._mode + "level"] + "";
        
        const otherInfoUpperLine = " Level: " + diffLevel + "  BPM: " + chartInfo.bpm;
        const otherInfoLowerLine = "Length: " + songMinutes + ":" + songSeconds +"  Total Notes: " + totalNoteCount;
        //const otherInfo = modeInfo + " Level:" + diffLevel + "  BPM:" + chartInfo.bpm + "  Length:" + songMinutes + ":" + songSeconds +"  Total Notes:" + totalNoteCount;

        const otherInfoPosX = DtxChartCanvasMargins.C + 
        ( this._DTXDrawParameters.ChipHorizontalPositions.width + DtxChartCanvasMargins.F ) * (MIN_PAGEPERCANVAS);//Information appears at 4 page wide

        const DtxMaxTitleWidth = (this._DTXDrawParameters.ChipHorizontalPositions.width + DtxChartCanvasMargins.F)*3.8 + DtxChartCanvasMargins.C;//Max span 4 pages long
        const DtxMaxArtistWidth = DtxMaxTitleWidth;
        const DtxMaxOtherInfoWidth = (this._DTXDrawParameters.ChipHorizontalPositions.width + DtxChartCanvasMargins.F)*2 + DtxChartCanvasMargins.D;

        /**ChartType and Difficulty Tier Decal */
        const decalName = this._mode + this._difficultyTier;

        //Repeat for every sheet available
        for(const i in this._chartSheets){
            if(!this._chartSheets[i]){
                console.log("Sheet unavailable! Unable to draw");
                continue;
            }

            //Draw Background Box first
            this._chartSheets[i].addRectangle({x: -1,
                                    y: -1,
                                    width: this._chartSheets[i].canvasWidthHeightPages().width + 2,
                                    height: DtxChartCanvasMargins.A + 3
                                    }, {
                                        fill: DtxFillColor.ChartInfo,
                                        originY: "top"
                                    });

            this._chartSheets[i].addText({
                                x: DtxChartCanvasMargins.C + DtxChartCanvasMargins.I,
                                y: DtxChartCanvasMargins.A - 19, //A is the Line divider, The Title text will be above the Artist text
                                width: DtxMaxTitleWidth
                                }, chartInfo.title, {
                                fill: DtxTextColor.ChartInfo,
                                fontSize: DtxFontSizes.Title,
                                fontFamily: "Meiryo UI",
                                originY: "bottom"
                            });

            if(chartInfo.artist && chartInfo.artist !== ""){
                this._chartSheets[i].addText({
                                x: DtxChartCanvasMargins.C + DtxChartCanvasMargins.I,
                                y: DtxChartCanvasMargins.A, //A is the Line divider, The Artist text will be slightly below it
                                width: DtxMaxArtistWidth
                                }, chartInfo.artist, {
                                fill: DtxTextColor.ChartInfo,
                                fontSize: DtxFontSizes.Artist,
                                fontFamily: "Meiryo UI",
                                originY: "bottom"
                            });
            }
            
            //Mode information
            this._chartSheets[i].addText({
                                x: otherInfoPosX,
                                y: DtxChartCanvasMargins.A - 19, //A is the Line divider, The Info text will be slightly above it
                                width: DtxMaxOtherInfoWidth
                                }, otherInfoUpperLine, {
                                fill: DtxTextColor.ChartInfo,
                                fontSize: DtxFontSizes.ChartInfo,
                                fontFamily: "Arial",
                                originY: "bottom",
                                originX: "right"
                            });

            //Other Information Text
            this._chartSheets[i].addText({
                                x: otherInfoPosX,
                                y: DtxChartCanvasMargins.A, //A is the Line divider, The Info text will be slightly above it
                                width: DtxMaxOtherInfoWidth
                                }, otherInfoLowerLine, {
                                fill: DtxTextColor.ChartInfo,
                                fontSize: DtxFontSizes.Artist,
                                fontFamily: "Arial",
                                originY: "bottom",
                                originX: "right"
                            });

            this._chartSheets[i].addLine({x: DtxChartCanvasMargins.C,
                                y: DtxChartCanvasMargins.A,
                                width:  this._chartSheets[i].canvasWidthHeightPages().width - DtxChartCanvasMargins.C - DtxChartCanvasMargins.D,
                                height: 0
                                }, {
                                    stroke: DtxBarLineColor.TitleLine,
                                    strokeWidth: 2,
                                });

            //Draw Decal at top left corner                    
            this._chartSheets[i].addChip({x: DtxChartCanvasMargins.C, 
                                y: DtxChartCanvasMargins.A / 2.0, //Add Chip has OriginY at Center so have to set in center of Info Section
                                width: 140, //Set to Actual image width
                                height: 50  //Set to actual image height
                            }, {
                                fill: null
                            }, this._DTXDrawParameters.imageSet[decalName]);                    
        }
    };

    Charter.prototype.drawBPMMarker = function(absPosition, bpmText){
        const pixSheetPos = this.getPixelPositionOfLine(absPosition);

        //Finally select the correct sheet to draw the chip
        const chartSheet = this._chartSheets[pixSheetPos.sheetIndex];
        if(!chartSheet){
            console.log("Sheet unavailable! Unable to draw");
            return;
        }

        chartSheet.addLine({x: pixSheetPos.posX + this._DTXDrawParameters.ChipHorizontalPositions.RightBorder,
                                y: pixSheetPos.posY,
                                width:  this._DTXDrawParameters.ChipHorizontalPositions.Bpm - this._DTXDrawParameters.ChipHorizontalPositions.RightBorder,
                                height: 0
                                }, {
                                    stroke: DtxBarLineColor.BPMMarkerLine,
                                    strokeWidth: 1,
                                });

        chartSheet.addText({x: pixSheetPos.posX + this._DTXDrawParameters.ChipHorizontalPositions.Bpm,
                            y: pixSheetPos.posY}, bpmText, {
                                fill: DtxTextColor.BpmMarker,
                                fontSize: DtxFontSizes.BpmMarker,
                                fontFamily: "Arial"
                            });
    };

    Charter.prototype.drawBarNumber = function(barIndex){
        //Sanity checks
        if(barIndex < 0 || barIndex >= 999){
            console.error('barIndex is out of range [000,999]');
        }

        let barNumText = "";
        if(barIndex < 10){
            barNumText = "00" + barIndex;
        }
        else if(barIndex < 100){
            barNumText = "0" + barIndex;
        }
        else{
            barNumText = "" + barIndex;
        }
        
        const absLinePos = this._positionMapper.absolutePositionOfLine(barIndex, 0);
        const pixSheetPos = this.getPixelPositionOfLine(absLinePos);

        //Finally select the correct sheet to draw the chip
        const chartSheet = this._chartSheets[pixSheetPos.sheetIndex];
        if(!chartSheet){
            console.log("Sheet unavailable! Unable to draw");
            return;
        }

        let textoffset = 0;
        let originYValue = "top";
        if(this._direction === "up"){            
            textoffset = 5;
            originYValue = "bottom";
        } else if(this._direction === "down"){
            textoffset = 0;
            originYValue = "top";
        }

        chartSheet.addText({x: pixSheetPos.posX + this._DTXDrawParameters.ChipHorizontalPositions.BarNum,
                            y: pixSheetPos.posY + textoffset}, //+5 works only for this font size and family
                            barNumText, {
                                fill: DtxTextColor.BarNumber,
                                fontSize: DtxFontSizes.BarNumber,
                                fontFamily: "Arial",
                                originY: originYValue
                            });
    };

    /**
     * Draws arbitrary lines in chart. Currently used to draw start and end lines of DTX
     */
    Charter.prototype.drawChartLine = function(absPosition, drawOptions){
        const pixSheetPos = this.getPixelPositionOfLine(absPosition);

        //
        const chartSheet = this._chartSheets[pixSheetPos.sheetIndex];
        if(!chartSheet){
            console.log("Sheet unavailable! Unable to draw");
            return;
        }
        const lineWidth = this._DTXDrawParameters.ChipHorizontalPositions.RightBorder - this._DTXDrawParameters.ChipHorizontalPositions.LeftBorder;
            chartSheet.addLine({x: pixSheetPos.posX + this._DTXDrawParameters.ChipHorizontalPositions.LeftBorder,
                                y: pixSheetPos.posY,
                                width: lineWidth,
                                height: 0
                                }, drawOptions);
    };

    Charter.prototype.drawLinesInBar = function(lineCount, barIndex){
        for(let j=0; j<lineCount; j += BEAT_LINE_GAP){
            const lineColor = j == 0 ? DtxBarLineColor.BarLine : DtxBarLineColor.QuarterLine;

            const absLinePos = this._positionMapper.absolutePositionOfLine(barIndex, j);
            const pixSheetPos = this.getPixelPositionOfLine(absLinePos);

            //Finally select the correct sheet to draw the chip
            const chartSheet = this._chartSheets[pixSheetPos.sheetIndex];
            if(!chartSheet){
                console.log("Sheet unavailable! Unable to draw");
                continue;
            }

            const lineWidth = this._DTXDrawParameters.ChipHorizontalPositions.RightBorder - this._DTXDrawParameters.ChipHorizontalPositions.LeftBorder;

            if(j == 0)
            {
                //Draw start bar line differently
                chartSheet.addLine({x: pixSheetPos.posX,
                                y: pixSheetPos.posY,
                                width: lineWidth + this._DTXDrawParameters.ChipHorizontalPositions.LeftBorder,
                                height: 0
                                }, {
                                    stroke: lineColor,
                                    strokeWidth: 1,
                                });
            } else {
                chartSheet.addLine({x: pixSheetPos.posX + this._DTXDrawParameters.ChipHorizontalPositions.LeftBorder,
                                y: pixSheetPos.posY,
                                width: lineWidth,
                                height: 0
                                }, {
                                    stroke: lineColor,
                                    strokeWidth: 1,
                                });
            }
            
        }
    };

    /**
     * Parameters:
     * chipPosArray - An array of {pos: <number>, label: <string>}
     * laneLabel - A string containing one of lane code inside Parser.DtxLaneLabels
     * barIndex - The index of bar which the chipPosArray belongs to
     */
    Charter.prototype.drawChipsInBar = function(chipPosArray, laneLabel, barIndex){
        //Iterate for each chip
        for(const i in chipPosArray){
            //Find absolutePosition of current chip (the time dimension only)
            const chipPos = chipPosArray[i];
            const absLinePos = this._positionMapper.absolutePositionOfLine(barIndex, chipPos["pos"]);

            //Convert absLinePos to Sheet Index and actual pixel x,y position of line
            const pixSheetPos = this.getPixelPositionOfLine(absLinePos);

            //Compute the final x position for this specific chip given the laneLabel
            //const chipPixXpos =  pixSheetPos.posX + this._DTXDrawParameters.ChipHorizontalPositions[laneLabel];

            //Finally select the correct sheet to draw the chip
            const chartSheet = this._chartSheets[pixSheetPos.sheetIndex];
            if(!chartSheet){
                console.log("Sheet unavailable! Unable to draw");
                continue;
            }

            //laneLabel, chartsheet, pixSheetPos, drawParameters
            this._drawNoteFunction(laneLabel, chartSheet, pixSheetPos, this._DTXDrawParameters);
        }

    };

    /**
     * Method: drawHoldNotes
     * Parameters:
     * holdNotesInfoArray - An array of HoldNotesInfo {"startBarPos": {barIndex: <int>, pos: <int>}, "endBarPos": {barIndex: <int>, pos: <int>}, "buttonType": ""}
     *  
     */
    Charter.prototype.drawHoldNotes = function(holdNotesInfoArray){

        for (let index = 0; index < holdNotesInfoArray.length; index++) {
            const holdNotesInfo = holdNotesInfoArray[index];
            
            //Get absolute pos for start and end position of Hold Note
            const startAbsPos = this._positionMapper.absolutePositionOfLine(holdNotesInfo["startBarPos"]["barIndex"], holdNotesInfo["startBarPos"]["pos"]);
            const endAbsPos = this._positionMapper.absolutePositionOfLine(holdNotesInfo["endBarPos"]["barIndex"], holdNotesInfo["endBarPos"]["pos"]);

            //Get pixelSheetPos for each of start and end for current canvas setting
            const startPixSheetPos = this.getPixelPositionOfLine(startAbsPos);
            const endPixSheetPos = this.getPixelPositionOfLine(endAbsPos);

            //Draw from start pos to end pos
            //VIOLA
            //NO. Not that simple. Hold Notes move across time, which is draw out vertically on canvas, thus it is possible to cross multiple columns and even canvas sheet!

            //Base on start and end PixSheetPos, calculate how many vertical segments to be drawn
            const currHoldNoteVerticalSegments = this._computeVerticalSegmentsForHoldNote(startPixSheetPos, endPixSheetPos);

            //To do the actual drawing given the verticalsegments info and buttonType
            //console.log("Hold note compute done");
            this._drawHoldNoteVerticalSegments(currHoldNoteVerticalSegments, holdNotesInfo["buttonType"]);
        }
    }

    Charter.prototype._drawHoldNoteVerticalSegments = function(currHoldNoteVerticalSegments, buttonType){
        
        //Get rectangle infos based on buttonType
        let isOpen = true;
        let currNoteFlagArray = [];
        for (let i = 0; i < this._DTXDrawParameters.flagArray.length; i++) {
            let flag = buttonType.charAt(i+1) === "1" ? 1 : 0;
            if(flag === 1){
                isOpen = false;
            }
            currNoteFlagArray.push(flag);                
        }
        
        if(isOpen){
            console.warn("Open should not have Hold notes!");
        }
        else{
            //Iterate for all vertical segments
            for (let index = 0; index < currHoldNoteVerticalSegments.length; index++) {
                const currVertSegment = currHoldNoteVerticalSegments[index];
                
                let currSheetIndex = currVertSegment.startPixSheetPos.sheetIndex;    
                let originYRect = "top";      
                if(this._direction === "up"){                
                    originYRect = "bottom";
                } else if(this._direction === "down"){                
                    originYRect = "top";
                }
                
                //Draw Rectangle only if button is pressed
                for (let j = 0; j < currNoteFlagArray.length; j++) {
                    const flag = currNoteFlagArray[j];
                    const flagLabel = this._DTXDrawParameters.flagArray[j]; 
                    if(flag === 1){
                        //Draw the required rectangles
                        let segPixPosX =  currVertSegment.startPixSheetPos.posX + this._DTXDrawParameters.ChipHorizontalPositions[flagLabel];
                        let segWidth = this._DTXDrawParameters.chipWidthHeight[flagLabel].width;
                        this._chartSheets[currSheetIndex].addRectangle({x: segPixPosX,
                            y: currVertSegment.startPixSheetPos.posY,
                            width: segWidth,//
                            height: Math.abs( currVertSegment.endPixSheetPos.posY - currVertSegment.startPixSheetPos.posY )
                            }, {
                                fill: this._DTXDrawParameters.chipColors[flagLabel],
                                originY: originYRect,
                                opacity: 0.5
                            });
                    }
                }    
            }
        }
    }

    /**
     * Method: _computeVerticalSegmentsForHoldNote (internal method)
     * Parameters:
     * startPixSheetPosition - The start position of hold note
     * endPixSheetPosition -  The end position of hold note
     * Returns: An array of start and end pixsheet positions for vertical segments
     */
    Charter.prototype._computeVerticalSegmentsForHoldNote = function(startPixSheetPosition, endPixSheetPosition){

        //Get absolute PageIndex for both start and end positions
        const startPageAbsIndex = startPixSheetPosition.sheetIndex * this._pagePerCanvas + startPixSheetPosition.sheetPageIndex;
        const endPageAbsIndex = endPixSheetPosition.sheetIndex * this._pagePerCanvas + endPixSheetPosition.sheetPageIndex;

        const numVerticalSegments = endPageAbsIndex - startPageAbsIndex + 1;
        const retArray = [];
        if(numVerticalSegments === 1){
            //Easy, just return the array as it is                
            retArray.push({
                startPixSheetPos : JSON.parse( JSON.stringify(startPixSheetPosition) ),//Deep copy?
                endPixSheetPos : JSON.parse( JSON.stringify(endPixSheetPosition) )
            });            
        }
        else{

            /**
                 * Some Number patterns to consider: numVerticalSegments - 1 = pairs of intermediate positions
                 * Thus, we can iterate by number of pairs of intermediate positions
                 */
            let currStartPixSheetPosition = JSON.parse( JSON.stringify(startPixSheetPosition) );
            
            for (let index = 0; index < numVerticalSegments - 1; index++) {
                let currPageAbsIndex = startPageAbsIndex + index;
                let currSheetIndex = Math.floor( currPageAbsIndex / this._pagePerCanvas );
                let currSheetPageIndex = currPageAbsIndex % this._pagePerCanvas;
                
                let startPoint = 0;
                let edgeOffset = DtxChartCanvasMargins.A + DtxChartCanvasMargins.B;
                let directionMultiplier = 1.0;
                if(this._direction === "up"){
                    startPoint = this._chartSheets[currSheetIndex].canvasWidthHeightPages().height;
                    edgeOffset = DtxChartCanvasMargins.E;
                    directionMultiplier = -1.0;                
                } else if(this._direction === "down"){
                    startPoint = 0;
                    edgeOffset = DtxChartCanvasMargins.A + DtxChartCanvasMargins.B;
                    directionMultiplier = 1.0;
                }

                //Get end pos of current vertical segment
                let currPageHeight = this._pageHeight;
                if(this._barAligned){
                    currPageHeight = this._pageList[currPageAbsIndex].BAPageHeight;
                }
                else{
                    currPageHeight = this._pageHeight;
                }                    
                let currVerticalEndPosY = startPoint + directionMultiplier * (edgeOffset + currPageHeight + DtxChartCanvasMargins.G);
                let currVerticalEndPosX = currStartPixSheetPosition["posX"];

                //Push into array
                retArray.push({
                    startPixSheetPos : currStartPixSheetPosition,
                    endPixSheetPos : {
                        sheetIndex: currSheetIndex,
                        sheetPageIndex: currSheetPageIndex,
                        posX: currVerticalEndPosX,
                        posY: currVerticalEndPosY
                    }
                });

                //Get start pos for NEXT vertical segment
                let nextVerticalStartPosY = startPoint + directionMultiplier * (edgeOffset + DtxChartCanvasMargins.G);
                let nextSheetIndex = Math.floor( (currPageAbsIndex + 1) / this._pagePerCanvas );
                let nextSheetPageIndex = (currPageAbsIndex + 1) % this._pagePerCanvas; 
                let nextVerticalStartPosX = DtxChartCanvasMargins.C + 
                ( this._DTXDrawParameters.ChipHorizontalPositions.width + DtxChartCanvasMargins.F ) * nextSheetPageIndex;

                currStartPixSheetPosition = {
                    sheetIndex: nextSheetIndex,
                    sheetPageIndex: nextSheetPageIndex,
                    posX: nextVerticalStartPosX,
                    posY: nextVerticalStartPosY
                };
                
            }    
            
            //Wrap up the last segment with the final pix position
            retArray.push({
                startPixSheetPos : currStartPixSheetPosition,
                endPixSheetPos : JSON.parse( JSON.stringify(endPixSheetPosition) )
            });
        }   
        
        return retArray;
    }

    /**
     * Method: getPixelPositionOfLine
     * Parameter:
     * absolutePositon - The absolute position of the a line
     */
    Charter.prototype.getPixelPositionOfLine = function(absolutePositon){
        //Check if in range of chart
        if(typeof absolutePositon !== "number" || absolutePositon < 0 || absolutePositon > this._positionMapper.chartLength()){//Allow the first line of bar after last bar to be computed
            console.error("absolutePositon is invalid or out of range");
            return;
        }

        if(this._barAligned)
        {
            //TODO:
            let pageIndex;

            let relativeAbsPos = 0;

            //Iterate from the back
            //Find out which page this position falls within
            for(let i = this._pageList.length - 1; i >= 0; --i){
                const lowerLimit = this._positionMapper.barGroups[this._pageList[i].startBarIndex].absStartPos;
                relativeAbsPos = absolutePositon - lowerLimit;//Will be negative until it first falls within the page
                if(relativeAbsPos >= 0){
                    pageIndex = i;
                    break;//found
                }
            }
            //
            const sheetIndex = Math.floor( pageIndex / this._pagePerCanvas );
            const sheetPageIndex = pageIndex % this._pagePerCanvas;
            const relativeYPixPos = relativeAbsPos * this._scale;
            
            let startPoint = 0;
            let edgeOffset = DtxChartCanvasMargins.A + DtxChartCanvasMargins.B;
            let directionMultiplier = 1.0;
            if(this._direction === "up"){
                startPoint = this._chartSheets[sheetIndex].canvasWidthHeightPages().height;
                edgeOffset = DtxChartCanvasMargins.E;
                directionMultiplier = -1.0;                
            } else if(this._direction === "down"){
                startPoint = 0;
                edgeOffset = DtxChartCanvasMargins.A + DtxChartCanvasMargins.B;
                directionMultiplier = 1.0;
            }
            
            const actualPixHeightPosofLine = startPoint + directionMultiplier * (edgeOffset + DtxChartCanvasMargins.G + relativeYPixPos);
            const actualPixWidthPosofLine = DtxChartCanvasMargins.C + 
            ( this._DTXDrawParameters.ChipHorizontalPositions.width + DtxChartCanvasMargins.F ) * sheetPageIndex;

            return {
                sheetIndex: sheetIndex,
                sheetPageIndex: sheetPageIndex,
                posX: actualPixWidthPosofLine,
                posY: actualPixHeightPosofLine
            };
        }
        else{
            const pageIndex = Math.floor((absolutePositon * this._scale) / this._pageHeight);

            if(pageIndex < 0 || pageIndex >= this._pageCount){
                console.error("absolutePositon is out of range of the charter!");
                return;
            }

            //
            const sheetIndex = Math.floor( pageIndex / this._pagePerCanvas );
            const sheetPageIndex = pageIndex % this._pagePerCanvas;
            const remainingRelativePos = (absolutePositon * this._scale) % this._pageHeight;

            let startPoint = 0;
            let edgeOffset = DtxChartCanvasMargins.A + DtxChartCanvasMargins.B;
            let directionMultiplier = 1.0;
            if(this._direction === "up"){
                startPoint = this._chartSheets[sheetIndex].canvasWidthHeightPages().height;
                edgeOffset = DtxChartCanvasMargins.E;
                directionMultiplier = -1.0;                
            } else if(this._direction === "down"){
                startPoint = 0;
                edgeOffset = DtxChartCanvasMargins.A + DtxChartCanvasMargins.B;
                directionMultiplier = 1.0;
            }
            
            const actualPixHeightPosofLine = startPoint + directionMultiplier * (edgeOffset + DtxChartCanvasMargins.G + remainingRelativePos);            
            const actualPixWidthPosofLine = DtxChartCanvasMargins.C + 
            ( this._DTXDrawParameters.ChipHorizontalPositions.width + DtxChartCanvasMargins.F ) * sheetPageIndex;

            return {
                sheetIndex: sheetIndex,
                sheetPageIndex: sheetPageIndex,
                posX: actualPixWidthPosofLine,
                posY: actualPixHeightPosofLine
            };
        }
    };

    /**
     * Helper functions
     */
    function limit(input, min, max){
        if(input > max){
            return max;
        }
        else if(input < min){
            return min;
        }
        else{
            return input;
        }            
    }    

    mod.Charter = Charter;
    return mod;
}(mod || {} ));

export const module = {
    ...DtxChart
}