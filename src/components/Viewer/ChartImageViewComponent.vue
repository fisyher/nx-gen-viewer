<template>
    <v-card class="scrollable">
        <div
            v-for="config in canvasConfigArray"
            :key="config.elementId"
        >
        
        <canvas :id="config.elementId"></canvas> 
        </div>
        <h2 v-if="!canvasConfigArray">Nothing to show</h2>                                                   
    </v-card>
</template>

<script>
//<img :id="getImgIdentifier(config.elementId)" :src="src" :class="zoomState" @click="onImgClick"/>
export default {
    name: 'ChartImageViewComponent',
    props:{
        src: String,
        canvasConfigArray: Array,
        charter: Object
    },
    data () {
      return {
        zoomState: 'zoomed-out',
        }
    },
    computed:{
        
    },
    methods: {
        onImgClick(){
            if(this.zoomState === 'zoomed-out'){
                this.zoomState = 'zoomed-in'
            }
            else{
                this.zoomState = 'zoomed-out'
            }
        },
        getImgIdentifier(canvasId){
            return "img_" + canvasId;
        }
    },
    beforeUpdate() {
      console.log("ChartImageViewComponent beforeUpdate")
    },
    updated() {
      console.log("ChartImageViewComponent updated");
      if(this.canvasConfigArray && this.charter && this.canvasConfigArray.length > 0){
          console.log("Draw chart");
          this.charter.setCanvasArray(this.canvasConfigArray);
          this.charter.drawDTXChart();
      }
    },
}
</script>

<style scoped>
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

.invisible{
    display: none;
}
</style>