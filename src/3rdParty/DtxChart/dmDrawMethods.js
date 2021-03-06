import { module as mod } from "./canvasEngineFabric"; 
/**
 * 
 */

const DtxChart = (function(mod){

    const CanvasEngine = mod.CanvasEngine;//Can be FabricJS, EaselJS or even raw Canvas API
    if(!CanvasEngine){
        console.error("CanvasEngine not loaded into DtxChart module! DtxChart.Charter will not render without a Canvas engine");
    }
    //Preload drum chips image assets
    const drumsChipImageSet_ArrayPromises = [];
    const drumsChipImageSet = {};
    drumsChipImageSet_ArrayPromises.push(CanvasEngine.loadChipImageAssets.call(drumsChipImageSet, require('./assets/images/leftcymbal_chip.png'), "LC"));
    drumsChipImageSet_ArrayPromises.push(CanvasEngine.loadChipImageAssets.call(drumsChipImageSet, require("./assets/images/hihat_chip.png"), "HH"));
    drumsChipImageSet_ArrayPromises.push(CanvasEngine.loadChipImageAssets.call(drumsChipImageSet, require("./assets/images/hihat_chip.png"), "HHO"));
    drumsChipImageSet_ArrayPromises.push(CanvasEngine.loadChipImageAssets.call(drumsChipImageSet, require("./assets/images/snare_chip.png"), "SD"));
    drumsChipImageSet_ArrayPromises.push(CanvasEngine.loadChipImageAssets.call(drumsChipImageSet, require("./assets/images/leftbass_chip.png"), "LB"));
    drumsChipImageSet_ArrayPromises.push(CanvasEngine.loadChipImageAssets.call(drumsChipImageSet, require("./assets/images/lefthihatpedal_chip.png"), "LP"));
    drumsChipImageSet_ArrayPromises.push(CanvasEngine.loadChipImageAssets.call(drumsChipImageSet, require("./assets/images/hitom_chip.png"), "HT"));
    drumsChipImageSet_ArrayPromises.push(CanvasEngine.loadChipImageAssets.call(drumsChipImageSet, require("./assets/images/rightbass_chip.png"), "BD"));
    drumsChipImageSet_ArrayPromises.push(CanvasEngine.loadChipImageAssets.call(drumsChipImageSet, require("./assets/images/lowtom_chip.png"), "LT"));
    drumsChipImageSet_ArrayPromises.push(CanvasEngine.loadChipImageAssets.call(drumsChipImageSet, require("./assets/images/floortom_chip.png"), "FT"));
    drumsChipImageSet_ArrayPromises.push(CanvasEngine.loadChipImageAssets.call(drumsChipImageSet, require("./assets/images/rightcymbal_chip.png"), "RC"));
    drumsChipImageSet_ArrayPromises.push(CanvasEngine.loadChipImageAssets.call(drumsChipImageSet, require("./assets/images/ridecymbal_chip.png"), "RD"));

    //Load Difficulty Word Art
    drumsChipImageSet_ArrayPromises.push(CanvasEngine.loadChipImageAssets.call(drumsChipImageSet, require("./assets/images/DrumBasicBannerSmall.png"), "drumBasic"));
    drumsChipImageSet_ArrayPromises.push(CanvasEngine.loadChipImageAssets.call(drumsChipImageSet, require("./assets/images/DrumAdvancedBannerSmall.png"), "drumAdvanced"));
    drumsChipImageSet_ArrayPromises.push(CanvasEngine.loadChipImageAssets.call(drumsChipImageSet, require("./assets/images/DrumExtremeBannerSmall.png"), "drumExtreme"));
    drumsChipImageSet_ArrayPromises.push(CanvasEngine.loadChipImageAssets.call(drumsChipImageSet, require("./assets/images/DrumMasterBannerSmall.png"), "drumMaster"));

    //Width and Height of chips are standard
    const DEFAULT_CHIP_HEIGHT = 5;
	const DEFAULT_CHIP_WIDTH = 18;
    const DEFAULT_LANE_BORDER = 1;

    //Put in a map and reference this map instead in case need to change
    const DtxChipWidthHeight = {
        "LC":{width: DEFAULT_CHIP_WIDTH+6, height: DEFAULT_CHIP_HEIGHT},
        "HH":{width: DEFAULT_CHIP_WIDTH, height: DEFAULT_CHIP_HEIGHT},
        "HHO":{width: DEFAULT_CHIP_WIDTH, height: DEFAULT_CHIP_HEIGHT},
        "LB":{width: DEFAULT_CHIP_WIDTH, height: DEFAULT_CHIP_HEIGHT},
		"LP":{width: DEFAULT_CHIP_WIDTH, height: DEFAULT_CHIP_HEIGHT},
		"SD":{width: DEFAULT_CHIP_WIDTH+3, height: DEFAULT_CHIP_HEIGHT},
		"HT":{width: DEFAULT_CHIP_WIDTH, height: DEFAULT_CHIP_HEIGHT},
		"BD":{width: DEFAULT_CHIP_WIDTH+5, height: DEFAULT_CHIP_HEIGHT},
		"LT":{width: DEFAULT_CHIP_WIDTH, height: DEFAULT_CHIP_HEIGHT},
		"FT":{width: DEFAULT_CHIP_WIDTH, height: DEFAULT_CHIP_HEIGHT},
		"RC":{width: DEFAULT_CHIP_WIDTH+6, height: DEFAULT_CHIP_HEIGHT},
		"RD":{width: DEFAULT_CHIP_WIDTH+1, height: DEFAULT_CHIP_HEIGHT},
    };

    const DtxChipLaneOrder = {
        "full": ["LC","HH","LP","SD","HT","BD","LT","FT","RC","RD"],//LP and LB are in the same position, HH and HHO too
        "Gitadora": ["LC","HH","LP","SD","HT","BD","LT","FT","RC"],
        "Vmix": ["HH","SD","BD","HT","LT","RC"]
    }; 

    const DtxChipColor = {
        "LC":"#ff4ca1",
		"HH":"#00ffff",
        "LB":"#e7baff",
		"LP":"#ffd3f0",
		"SD":"#fff040",
		"HT":"#00ff00",
		"BD":"#e7baff",
		"LT":"#ff0000",
		"FT":"#fea101",
		"RC":"#00ccff",
		"RD":"#5a9cf9",
    };

    function createDrawParameters(chartType){
        const drawParameters = {};        
        //Currently works for proper charts but when drawing mismatch chart, chips in lanes ignored are never drawn
        drawParameters.ChipHorizontalPositions = _computeChipHorizontalPositions(chartType);

        //Widths
        drawParameters.chipWidthHeight = _computeChipWidthHeight(chartType);

        //Color
        drawParameters.chipColors = {};
        for(const prop in DtxChipColor){            
            if(Object.prototype.hasOwnProperty.call(DtxChipColor, prop)){
                drawParameters.chipColors[prop] = DtxChipColor[prop];
            }
        }
        //Image if available
        drawParameters.imageSet_promises = drumsChipImageSet_ArrayPromises;
        drawParameters.imageSet = drumsChipImageSet;

        //
        drawParameters.elementIDPrefix = "dtxdrums";
        return drawParameters;
    }

    function drawNote(laneLabel, chartSheet, pixSheetPos, drawParameters){
        //Compute the final x position for this specific chip given the laneLabel
        const chipPixXpos =  pixSheetPos.posX + drawParameters.ChipHorizontalPositions[laneLabel];

        chartSheet.addChip({x: chipPixXpos, 
                                y: pixSheetPos.posY,
                                width: drawParameters.chipWidthHeight[laneLabel].width,
                                height: drawParameters.chipWidthHeight[laneLabel].height
                            }, {
                                fill: drawParameters.chipColors[laneLabel]
                            }, drawParameters.imageSet[laneLabel]);

    }

    function _computeChipHorizontalPositions(chartType){
        const ChipHorizontalPositions = {
            "BarNum":5,
            "LeftBorder":47
        };

        let innerChartType = chartType;
        if(DtxChipLaneOrder[chartType] === undefined)
        {
            innerChartType = "full";
        }

        let currXpos = 50;
        for(let i=0; i < DtxChipLaneOrder[innerChartType].length; ++i ){
            const lane = DtxChipLaneOrder[innerChartType][i];
            const chipWidth = drumsChipImageSet[lane] ? drumsChipImageSet[lane].width : DtxChipWidthHeight[lane].width;
            ChipHorizontalPositions[lane] = currXpos;
            currXpos += chipWidth + DEFAULT_LANE_BORDER;
        }

        ChipHorizontalPositions["RightBorder"] = currXpos;
        ChipHorizontalPositions["Bpm"] = currXpos + 8;
        ChipHorizontalPositions["width"] = currXpos + 8 + 48;

        //"full", "Gitadora", "Vmix"
        //Do following mapping based on ChartType
        if(innerChartType === "full")
        {
            ChipHorizontalPositions["LB"] = ChipHorizontalPositions["LP"];
            ChipHorizontalPositions["HHO"] = ChipHorizontalPositions["HH"];
        }
        else if(innerChartType === "Gitadora")
        {
            ChipHorizontalPositions["RD"] = ChipHorizontalPositions["RC"];//RD notes will appear at RC lane for Gitadora mode
            ChipHorizontalPositions["LB"] = ChipHorizontalPositions["LP"];
            ChipHorizontalPositions["HHO"] = ChipHorizontalPositions["HH"];
        }
        else if(innerChartType === "Vmix")
        {
            ChipHorizontalPositions["LC"] = ChipHorizontalPositions["HH"];
            ChipHorizontalPositions["LP"] = ChipHorizontalPositions["HH"];
            ChipHorizontalPositions["FT"] = ChipHorizontalPositions["LT"];
            ChipHorizontalPositions["RD"] = ChipHorizontalPositions["RC"];
            ChipHorizontalPositions["LB"] = ChipHorizontalPositions["BD"];
            ChipHorizontalPositions["HHO"] = ChipHorizontalPositions["HH"];
        }

        return ChipHorizontalPositions;
    }

    function _computeChipWidthHeight(chartType){
        const chipWidthHeight = {};
        for(const prop in DtxChipWidthHeight){            
            if(Object.prototype.hasOwnProperty.call(DtxChipWidthHeight, prop)){
                chipWidthHeight[prop] = {};
                chipWidthHeight[prop].width = drumsChipImageSet[prop] ? drumsChipImageSet[prop].width : DtxChipWidthHeight[prop].width;
                chipWidthHeight[prop].height = drumsChipImageSet[prop] ? drumsChipImageSet[prop].height : DtxChipWidthHeight[prop].height;
            }
        }

        let innerChartType = chartType;
        if(DtxChipLaneOrder[chartType] === undefined)
        {
            innerChartType = "full";
        }

        //"full", "Gitadora", "Vmix"
        //Do following mapping based on ChartType
        if(innerChartType === "full")
        {
            chipWidthHeight["LB"] = chipWidthHeight["LP"];
            chipWidthHeight["HHO"] = chipWidthHeight["HH"];
        }
        else if(innerChartType === "Gitadora")
        {
            chipWidthHeight["LB"] = chipWidthHeight["LP"];
            chipWidthHeight["RD"] = chipWidthHeight["RC"];//RD notes will appear at RC lane for Gitadora mode
            chipWidthHeight["HHO"] = chipWidthHeight["HH"];
        }
        else if(innerChartType === "Vmix")
        {
            chipWidthHeight["LC"] = chipWidthHeight["HH"];
            chipWidthHeight["LP"] = chipWidthHeight["HH"];
            chipWidthHeight["FT"] = chipWidthHeight["LT"];
            chipWidthHeight["RD"] = chipWidthHeight["RC"];
            chipWidthHeight["LB"] = chipWidthHeight["BD"];
            chipWidthHeight["HHO"] = chipWidthHeight["HH"];
        }

        return chipWidthHeight;
    }     

    const DMDrawMethods = {
        createDrawParameters: createDrawParameters,
        drawNote: drawNote
    };

    mod.DMDrawMethods = DMDrawMethods;
    return mod;
}(mod || {} ));

//
export const module = {
    ...DtxChart
}