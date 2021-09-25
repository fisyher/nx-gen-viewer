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
                       <v-card
                        elevation="20"
                        outlined
                        shaped
                       >
                        <v-card-title>Card Meta Information</v-card-title>
                        <v-card-subtitle>Metadata description of this card</v-card-subtitle>
                       </v-card>
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
                            <v-card class="scrollable">
                                <img :src="item.src" :class="zoomState" @click="onImgClick"/>                                                    
                            </v-card>
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
            <v-card
            
            >
            <v-card-title>Main Control</v-card-title>
            <v-card-text>
                <v-file-input
                    show-size
                    label="File input"
                ></v-file-input>
                
            </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn
                color="warning"
                >Clear</v-btn>
            </v-card-actions>
            </v-card>

            <v-card
            
            >
            <v-card-title>Options</v-card-title>
            <v-card-text>
            <v-select
            :items="diffs"
            v-model="selectedDiff"
            label="Difficulty Label"                
            ></v-select>

            <v-select
                :items="scaleFactors"
                v-model="selectedFactor"
                label="Scale"                
                ></v-select>
                <v-select
                :items="heightChoices"
                v-model="selectedHeight"
                label="Height (px)"                
                ></v-select>
                <v-select
                :items="modes"
                v-model="selectedMode"
                label="Mode"                
                ></v-select>
                <v-checkbox
                    v-model="checkbox"                    
                    label="Show Level"
                    required
                ></v-checkbox>
            </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn
                color="warning"
                >Re-draw</v-btn>
            </v-card-actions>
            </v-card>
            </v-sheet>
          </v-col>
          <v-spacer></v-spacer>
        </v-row>
    </v-container>
</template>

<script>
export default {
    name: 'Dashboard',
    data () {
      return {
        tab: null,
        zoomState: 'zoomed-out',
        checkbox: true,
        selectedDiff: 'Basic',
        selectedFactor: '1.00',
        selectedHeight: '2000',
        selectedMode: 'XG/Gitadora',
        items: [
          { tab: 'One', content: 'Tab 1 Content', src: require('../assets/huge_image_test.png')  },
          { tab: 'Two', content: 'Tab 2 Content', src: require('../assets/logo.png') },
          { tab: 'Three', content: 'Tab 3 Content', src: require('../assets/logo.png') },
          { tab: 'Four', content: 'Tab 4 Content', src: require('../assets/logo.png') },
          { tab: 'Five', content: 'Tab 5 Content', src: require('../assets/logo.png') }
        ],
        diffs: [
            'Basic',
            'Advanced',
            'Extreme',
            'Master'
        ],
        scaleFactors: [
            '0.5',
            '0.75',
            '1.00',
            '1.50',
            '2.00'
        ],
        heightChoices: [
            '2000',
            '2500',
            '3000',
            '3500',
            '4000'
        ],
        modes: [
            'XG/Gitadora',
            'V-Series',
            'Full'
        ]
      }
    },
    methods: {
        onImgClick(){
            if(this.zoomState === 'zoomed-out'){
                this.zoomState = 'zoomed-in'
            }
            else{
                this.zoomState = 'zoomed-out'
            }
        }
    }
}


</script>

<style scoped>
.zoomable {
    cursor:zoom-in;
}

.zoomed-in{
    cursor:zoom-out;
    width: auto;
}

.zoomed-out{
    cursor:zoom-in;
    width: 100%;
}

.scrollable{
    overflow: auto;
}
</style>
