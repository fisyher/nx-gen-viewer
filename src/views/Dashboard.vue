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
            <ChartFileInputComponent></ChartFileInputComponent>
            <DrawOptionsComponent></DrawOptionsComponent>
            
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

export default {
    name: 'Dashboard',
    components: {
        MetaInfoComponent, ChartFileInputComponent, ChartImageViewComponent, DrawOptionsComponent
    },
    data () {
      return {
        tab: null,        
        items: [
          { tab: 'One', content: 'Tab 1 Content', src: require('../assets/huge_image_test.png')  },
          { tab: 'Two', content: 'Tab 2 Content', src: require('../assets/logo.png') },
          { tab: 'Three', content: 'Tab 3 Content', src: require('../assets/logo.png') },
          { tab: 'Four', content: 'Tab 4 Content', src: require('../assets/logo.png') },
          { tab: 'Five', content: 'Tab 5 Content', src: require('../assets/logo.png') }
        ]
      }
    },
    methods: {
        
    },
    beforeCreate() {
      console.log("Dashboard beforeCreate")
    },
    created() {
      console.log("Dashboard created")
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
