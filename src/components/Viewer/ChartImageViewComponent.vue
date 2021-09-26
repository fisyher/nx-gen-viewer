<template>
    <v-card class="scrollable">
        <img :src="src" :class="zoomState" @click="onImgClick"/>                                                    
    </v-card>
</template>

<script>
export default {
    name: 'ChartImageViewComponent',
    props:{
        src: String
    },
    data () {
      return {
        zoomState: 'zoomed-out',
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