import { module as mod } from "./parser";

/*
DtxChart.LinePositionMapper
Description: The LinePositionMapper reads in dtxdata object, 
calculate and stores absolute line positions for the start of each bar and all bpmChangeMarkers within each bar
This allows easy computing of absolute position of any line given a bar and line number now that each bar has independent absolute position information
*/
const DtxChart = (function(mod){

    //Constants
    const BASEBPM = 180.00;
    const QUARTER_BEAT_LINES = 48;

    /**
     *Constructor 
     */
    function LinePositionMapper(dtxdata){
        this._initialize();
        this._computePositions(dtxdata);
        //
        //console.log(this.barGroups);
    }

    /**
     * Returns: The absolute position of a given bar number and line number position.
     * Absolute position is defined as the number of 1/192 beats elapsed at 180 BPM for standard 4/4 bar
     * 1 Abs Pos is equal to 60/(180*48) seconds
     */
    LinePositionMapper.prototype.absolutePositionOfLine = function(barNumber, lineNumber){
        //check barNumber
        if(typeof barNumber !== "number" || barNumber < 0 || barNumber >= this.barGroups.length){
            console.error("barNumber is invalid or out of range");
            return;
        }

        //Check lineNumber
        if(typeof lineNumber !== "number" || lineNumber < 0 || lineNumber >= this.barGroups[barNumber]["lines"]){
            console.error("lineNumber is invalid or out of range");
            return;
        }

        //Search for line number iteratively and compute accordingly
        const currBar = this.barGroups[barNumber];
        let currLinePos = 0;
        let currAbsPos = this.barGroups[barNumber]["absStartPos"];
        let currBPM = this.barGroups[barNumber]["barStartBPM"];

        //Search through bpm marker array if the line number fits within any section
        for(const i in currBar["bpmMarkerArray"]){
            const currBPMMarkerPos = currBar["bpmMarkerArray"][i]["pos"];

            //Check if lineNumber is within currStartLine inclusive and first bpm marker position (exclusive)
            if(lineNumber >= currLinePos && lineNumber < currBPMMarkerPos) 
            {
                const distance = (lineNumber - currLinePos) * BASEBPM / currBPM;//Formula to compute distance
                return distance + currAbsPos;
            }

            //update variables for next iteration
            currLinePos = currBPMMarkerPos;
            currAbsPos = currBar["bpmMarkerArray"][i]["absPos"];
            currBPM = currBar["bpmMarkerArray"][i]["bpm"];
        }
        //End Search

        //If line number is not found within any bpm markers or bpmMarkerArray is empty, compute with updated information
        const distance = (lineNumber - currLinePos) * BASEBPM / currBPM;//Formula to compute distance
        return distance + currAbsPos;

    }

    LinePositionMapper.prototype.estimateSongDuration = function(){
        const distance = this.endLineAbsPosition - this.bgmStartLineAbsPosition;

        //Duration in seconds
        return (60*distance)/(BASEBPM * QUARTER_BEAT_LINES);

    };

    /**
     * Useful for getting the bgm start line for drawing on chart
     */
    LinePositionMapper.prototype.bgmStartAbsolutePosition = function(){
        return this.bgmStartLineAbsPosition;
    };

    /**
     * Returns the length of entire chart in absolute position number
     */
    LinePositionMapper.prototype.chartLength = function(){
        return this.endLineAbsPosition;
    }

    /**
     * Returns the elapsed time of selected barNumber and LineNumber from beginning Abs Pos 0
     * in ms
     * Returns null if input parameters are invalid
     * 1 Abs Pos is equal to 60/(180*48) seconds
     */
    LinePositionMapper.prototype.offsetTime = function(barNumber, lineNumber){
        const absPos = this.absolutePositionOfLine(barNumber, lineNumber);
        if(typeof absPos !== "number" || absPos < 0){
            console.error("absPos is invalid or out of range");
            return;
        }
        return absPos * 1000 * (60/(180*48));
    }

    /**
     * Returns total number of bars for loaded dtx
     */
    LinePositionMapper.prototype.totalNumberOfBars = function(){
        return this.barGroups.length;
    }

    /**
     * Returns number of lines in specified zero-indexed barNumber
     */
    LinePositionMapper.prototype.numberOfLinesInBar = function(barNumber){
        //check barNumber
        if(typeof barNumber !== "number" || barNumber < 0 || barNumber >= this.barGroups.length){
            console.error("barNumber is invalid or out of range");
            return;
        }

        return this.barGroups[barNumber]["lines"];
    }


    /**
     * Remarks: This method does not check for correctness of values
     * dtxdata data correctness to be done inside parser instead
     */    
    LinePositionMapper.prototype._computePositions = function(dtxdata){

        let currBPM = dtxdata.chartInfo.bpm;//Initial BPM, this variable keeps changing within the nested loop as bpm markers are iterated through
        let currBarStartLineAbsPos = 0.0;//Starts at 0.0 for the first bar
        let bgmChipFound = false;//Flag to indicate bgm marker has been found the first time. Subsequent bgm chips are ignored.
        let bgmChipBarLinePos = null;//will be object of {barNum: <number>, pos: <number>} after bgmChip is found
        
        for(const i in dtxdata.barGroups){
            //Check for earliest bgm chip
            if(!bgmChipFound && dtxdata.barGroups[i]["bgmChipArray"]){
                bgmChipBarLinePos = {
                    barNum: parseInt(i),
                    pos: dtxdata.barGroups[i]["bgmChipArray"][0].pos
                };
                bgmChipFound = true;
            }
            //Create and Initialize the barPosInfo object for current bar
            const barPosInfo = {
                "lines": dtxdata.barGroups[i]["lines"],
                "bpmMarkerArray": dtxdata.barGroups[i]["bpmMarkerArray"] ? dtxdata.barGroups[i]["bpmMarkerArray"] : [],//Note that in actual JSON bpmMarkerArray property may not exist so we need to check and set default empty array if not available
                "absStartPos": currBarStartLineAbsPos,
                "barStartBPM": currBPM//Need to store this info, otherwise have to re-compute from previous bars!
            };

            //
            const currBarLineCount = barPosInfo["lines"];

            //Calculate the absolute position for each bpm marker
            let currLineAbsPos = currBarStartLineAbsPos;
            let currLineNumPosInBar = 0;

            //This section is skipped for most songs that have constant BPM throughout
            for(const j in barPosInfo["bpmMarkerArray"]){
                const currBPMMarkerBPM = barPosInfo["bpmMarkerArray"][j]["bpm"];
                const currBPMMarkerLineNumPos = barPosInfo["bpmMarkerArray"][j]["pos"];

                //Compute the absolute position of current marker
                const distance = (currBPMMarkerLineNumPos - currLineNumPosInBar) * BASEBPM / currBPM;//Formula to compute distance
                const currMarkerAbsPos = currLineAbsPos + distance;

                //Save inside barPosInfo
                barPosInfo["bpmMarkerArray"][j]["absPos"] = currMarkerAbsPos;

                //Update state variables for the next marker
                currLineAbsPos = currMarkerAbsPos;
                currLineNumPosInBar = currBPMMarkerLineNumPos;
                currBPM = currBPMMarkerBPM;//To be carried over to next bar once this for-loop ends
            }
            //End BPM marker absolute position computation

            //Calculate currBarStartLineAbsPos to be used for the next bar in next iteration
            const finalDistance = (currBarLineCount - currLineNumPosInBar) * BASEBPM / currBPM;
            currBarStartLineAbsPos = currLineAbsPos + finalDistance;

            //Push current barPosInfo into array
            this.barGroups.push(barPosInfo);
        }

        //Calculate the actual absolute position of first bgmChip here if found
        if(bgmChipFound){
            const absPos = this.absolutePositionOfLine(bgmChipBarLinePos.barNum, bgmChipBarLinePos.pos);
            if(absPos){
                this.bgmStartLineAbsPosition = absPos;
            }
        }


        //The end line does not belong to any bar and is one line after very last line of last bar
        //This is useful information for chart drawing class
        this.endLineAbsPosition = currBarStartLineAbsPos;

    };

    

    LinePositionMapper.prototype._initialize = function(){
        this.barGroups = [];
        this.endLineAbsPosition = 0.0;
        this.bgmStartLineAbsPosition = 0.0;
    };

    //For internal reference
    /*
    const sampleLinePosMap = {
        "barGroups":[
            {
                "lines": 192,
                "absStartPos": 0,
                "barStartBPM": 180,
                "bpmMarkerArray": [
                    {
                        "absPos": 0,
                        "pos": 0,
                        "bpm": 135
                    },
                    {
                        "absPos": 48,
                        "pos": 48,
                        "bpm": 130
                    },
                    {
                        "absPos": 96,
                        "pos": 96,
                        "bpm": 118
                    }
                ]
            },
            {

            }
        ]
    };
    */

    //
    mod.LinePositionMapper = LinePositionMapper;

    return mod;
}(mod || {} ));

//
export const module = {
    ...DtxChart
}