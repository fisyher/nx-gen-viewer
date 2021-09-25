<template>
    <v-card
    tile    
    >
        <v-card-actions>
            <v-card-title>Section {{id+1}}</v-card-title>
            <v-spacer></v-spacer>
            <v-btn
            dense
            fab
            color="red"
            @click="onCloseBtnClick"
            >
                <v-icon>mdi-close</v-icon>
            </v-btn>
        </v-card-actions>
        <v-card-actions>
            <v-text-field
                label="From"
                type="number"
                min="0"
                max="999999"
                v-model="startTime"
                suffix="ms"
                @change="onChange"
            ></v-text-field>
            <v-divider></v-divider>
            <v-text-field
                label="To"
                type="number"
                min="0"
                max="999999"
                v-model="endTime"
                suffix="ms"
                @change="onChange"
            ></v-text-field>
            <v-divider></v-divider>
            <v-select
            :items="items"
            v-model="selectedFactor"
            label="Time Signature Unit"
            @input="setSelected"                
            ></v-select>
            <v-divider></v-divider>
            <v-text-field
                label="Multiplier"
                type="number"
                min="0"
                max="999"
                v-model="multiplier"
                @change="onChange"
            ></v-text-field>
            <v-divider></v-divider>
            <v-text-field 
                readonly
                label="Output BPM"
                :value="outputBPM"
                suffix="BPM"
                >                
            </v-text-field>
        </v-card-actions>
    </v-card>
</template>

<script>
export default {
    name: 'BeatRangeItem',
    props: {
        id: Number,
        startTimeProp: Number,
        endTimeProp: Number
    },
    data: () => ({
        items: [
            { text: '1/4', value: 4 },
            { text: '1/8', value: 8 },
            { text: '1/12', value: 12 },
            { text: '1/16', value: 16 },
            { text: '1/24', value: 24 },
            { text: '1/32', value: 32 },
            { text: '1/48', value: 48 },
            { text: '1/64', value: 64 },
            { text: '1/192', value: 192 }
        ],
        startTime: 0,
        endTime: 300,
        selectedFactor: 4,
        multiplier: 1,
        outputBPM: 200.0 
    }),
    created(){
        this.startTime = this.startTimeProp;
        this.endTime = this.endTimeProp;
        this.outputBPM = this.computeBPM();
    },
    emits:[
        'delete-item'
    ],
    methods:{        
        computeBPM(){
            /*
            BPM = (60000 * 4n) / ( Elapsed Time * Ts )
            */
            const elapsedTime = this.endTime - this.startTime;
            if(elapsedTime < 0){
                return 0;
            }
            const outBPM = (60000 * 4 * this.multiplier) / (elapsedTime * this.selectedFactor)
            return outBPM;
        },
        setSelected(value) {
            console.log(value);
            this.outputBPM = this.computeBPM();
        },
        onChange(){
            this.outputBPM = this.computeBPM();
        },
        onCloseBtnClick(){
            //console.log('Item id ' + this.id + ' clicked');
            this.$emit('delete-item', this.id);
        }
        
    }
}
</script>