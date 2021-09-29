<template>
    <v-container fluid>
        <v-row>
          <v-spacer></v-spacer>
          <v-col cols="8">
            <v-sheet min-height="100vh"
              rounded="lg">

               <v-container>
                   <v-row>
                       <v-col
                       cols="12"
                       >
                       <MetaInfoComponent>
                       </MetaInfoComponent>
                       </v-col>
                   </v-row>

                   <v-row>
                       <v-col
                       cols="12"
                       >
                       <!--Tabs -->
                        <v-tabs
                            v-model="tab"
                            background-color="warning"
                            dark
                        >
                        <v-tab
                            v-for="item in items"
                            :key="item.tab"
                        >
                            {{ item.tab }}
                        </v-tab>
                        </v-tabs>
                        <!--Tab content -->
                        <v-tabs-items v-model="tab">
                        <v-tab-item
                            v-for="item in items"
                            :key="item.tab"
                        >
                            <ChartImageViewComponent
                                :src = "item.src"
                                :canvasConfigArray = "item.canvasConfig"
                                :charter = "item.charter"
                            ></ChartImageViewComponent>
                        </v-tab-item>
                        </v-tabs-items>

                       </v-col>
                   </v-row>
               </v-container>

            </v-sheet>
          </v-col>  
          <v-col cols="2">
            <v-sheet min-height="70vh"
            rounded="lg">
            <ChartFileInputComponent @file-loaded="drawNewChart" @file-reset="clearChart"></ChartFileInputComponent>
            <DrawOptionsComponent @redraw-chart="redrawChart" ref="drawOptions"></DrawOptionsComponent>
            
            </v-sheet>
          </v-col>
          <v-spacer></v-spacer>
        </v-row>
    </v-container>
</template>

<script>
import MetaInfoComponent from '../components/Viewer/MetaInfoComponent.vue';
import ChartFileInputComponent from '../components/Viewer/ChartFileInputComponent.vue';
import ChartImageViewComponent from '../components/Viewer/ChartImageViewComponent.vue';
import DrawOptionsComponent from '../components/Viewer/DrawOptionsComponent.vue';
//
import DtxChart from '../3rdParty/DtxChart';

export default {
    name: 'Dashboard',
    components: {
        MetaInfoComponent, ChartFileInputComponent, ChartImageViewComponent, DrawOptionsComponent
    },
    data () {
      return {
        tab: null,        
        items: [
          { tab: 'Drum', canvasConfig: null, charter: null, content: 'Tab 1 Content', src: require('../assets/images/huge_image_test.png')  },
          { tab: 'Guitar', canvasConfig: null, charter: null, content: 'Tab 2 Content', src: require('../assets/images/logo.svg') },
          { tab: 'Bass', canvasConfig: null, charter: null, content: 'Tab 3 Content', src: require('../assets/images/logo.svg') },
          { tab: 'Graphs', canvasConfig: null, charter: null, content: 'Tab 4 Content', src: require('../assets/images/logo.png') },
          { tab: 'Phrase Maker', canvasConfig: null, charter: null, content: 'Tab 5 Content', src: require('../assets/images/logo.png') }
        ],
        dmDrumCharter: null,
        gfGuitarCharter: null,
        gfBassCharter: null
      }
    },
    methods: {
        redrawChart(newConfig){
          console.log("redraw with new config: ");
          console.log(newConfig);

          /*
          selectedDiff: this.selectedDiff,
                selectedFactor: this.selectedFactor,
                selectedHeight: this.selectedHeight,
                selectedMode: this.selectedMode,
                checkbox: this.checkbox
          */
          this.dmDrumCharter.clearDTXChart();
          this.gfGuitarCharter.clearDTXChart();
          this.gfBassCharter.clearDTXChart();

          //
          const dmChartConfigOptions = {
            scale: parseFloat( newConfig.selectedFactor ),
            pageHeight: parseInt( newConfig.selectedHeight ),
            pagePerCanvas: 50,
            chartType: newConfig.selectedMode,
            mode: "drum",
            difficultyTier: newConfig.selectedDiff,
            barAligned : true,//Test
            direction: "up",//up or down
            drawParameters: DtxChart.DMDrawMethods.createDrawParameters( newConfig.selectedMode ),
            drawNoteFunction: DtxChart.DMDrawMethods.drawNote
          };

          //
          const gfGuitarChartConfigOptions = {
            ...dmChartConfigOptions,
            mode: "guitar",
            direction: "down",//up or down
            drawParameters: DtxChart.GFDrawMethods.createDrawParameters( newConfig.selectedMode, 'G' ),
            drawNoteFunction: DtxChart.GFDrawMethods.drawNote

          };

          const gfBassChartConfigOptions = {
            ...gfGuitarChartConfigOptions,
            mode: "bass",
            drawParameters: DtxChart.GFDrawMethods.createDrawParameters( newConfig.selectedMode, 'B' )
          };

          this.dmDrumCharter.setConfig(dmChartConfigOptions);
          this.gfGuitarCharter.setConfig(gfGuitarChartConfigOptions);
          this.gfBassCharter.setConfig(gfBassChartConfigOptions);

          const dmcanvasConfigArray = this.dmDrumCharter.canvasRequired();
          const gfgcanvasConfigArray = this.gfGuitarCharter.canvasRequired();
          const gfbcanvasConfigArray = this.gfBassCharter.canvasRequired();

          console.log(dmcanvasConfigArray);
          this.items[0].canvasConfig = dmcanvasConfigArray;
          console.log(gfgcanvasConfigArray);
          this.items[1].canvasConfig = gfgcanvasConfigArray;
          console.log(gfbcanvasConfigArray);
          this.items[2].canvasConfig = gfbcanvasConfigArray;

          this.items[0].charter = this.dmDrumCharter;
          this.items[1].charter = this.gfGuitarCharter;
          this.items[2].charter = this.gfBassCharter;

          console.log("End redraw function ");

        },
        drawNewChart(fileContent, extension){
          
          console.log("Draw new content with current config: ");
          const currConfig = this.$refs.drawOptions.currentConfig();
          console.log(currConfig);

          //
          const dtxparserv2 = new DtxChart.Parser({mode: extension.toLowerCase()});
          const result = dtxparserv2.parseDtxText(fileContent);

          if(result){
            const dtxdataObject = dtxparserv2.getDtxDataObject();
            //console.log(dtxdataObject);
            //console.log(JSON.stringify(dtxdataObject));
            const lineMapper = new DtxChart.LinePositionMapper(dtxdataObject);
            this.dmDrumCharter.setDtxData(dtxdataObject, lineMapper);
            this.gfGuitarCharter.setDtxData(dtxdataObject, lineMapper);
            this.gfBassCharter.setDtxData(dtxdataObject, lineMapper);

            //
            this.redrawChart(currConfig);

          }
          else{
            alert("Fail to load input file");
          }


        },
        clearChart(){
          console.log('Clear chart');
          this.dmDrumCharter.clearDTXChart();
          this.gfGuitarCharter.clearDTXChart();
          this.gfBassCharter.clearDTXChart();
          this.items.forEach(item => {
            item.canvasConfig = null;
            item.charter = null;
          });

        }
    },
    beforeCreate() {
      console.log("Dashboard beforeCreate")
    },
    created() {
      console.log("Dashboard created");
      console.log(DtxChart);
      this.dmDrumCharter = new DtxChart.Charter();
      this.gfGuitarCharter = new DtxChart.Charter();
      this.gfBassCharter = new DtxChart.Charter();
      
      
    },
    beforeMount() {
      console.log("Dashboard beforeMount")
    },
    mounted() {
      console.log("Dashboard mounted")
    },
    beforeUpdate() {
      console.log("Dashboard beforeUpdate")
    },
    updated() {
      console.log("Dashboard updated")
    },
    beforeDestroy() {
      console.log("Dashboard beforeDestroy")
    },
    destroyed() {
      console.log("Dashboard destroyed")
    }
}


</script>

<style scoped>

</style>
