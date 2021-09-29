import { module } from "./charter";

/*
Chain load in following order:
parser
linePositionMapper
canvasEngineFabric
dmDrawMethods
gfDrawMethods
chartSheet
graph
charter
*/

export default {
    ...module
};