<template>
    <v-container fluid>
        <v-row>
            <v-spacer></v-spacer>
            <v-col cols='8'>
                <v-card
                elevation="5"
                >
                <v-card-title>BPM Calculator</v-card-title>
                <v-card-subtitle>Compute the required BPM to fit the elapsed time given 2 time positions and a Time Signature</v-card-subtitle>

                <v-divider></v-divider>
                <v-card-actions>
                    <v-text-field
                        label="Start"
                        type="number"
                        min="0"
                        max="999999"
                        v-model="formStartTime"
                        suffix="ms"
                    ></v-text-field>
                    <v-spacer></v-spacer>
                    <v-text-field
                        label="End"
                        type="number"
                        min="0"
                        max="999999"
                        v-model="formEndTime"
                        suffix="ms"
                    ></v-text-field>
                    <v-spacer></v-spacer>
                    <v-btn
                    color="primary"
                    @click="addItem"
                    >
                        <v-icon>mdi-plus</v-icon>
                    </v-btn>
                </v-card-actions>
                <!-- -->
                <BeatRangeItem
                v-for="item in BRPropItems"
                :key="item.id"
                :id="item.id"
                :startTimeProp="item.startTime"
                :endTimeProp="item.endTime"
                @delete-item="itemClosed"
                ></BeatRangeItem>
                <!-- -->
                </v-card>
            </v-col>
            <v-col cols='2'>
                <v-sheet 
                    min-height="70vh"
                    rounded="lg">
                </v-sheet>
            </v-col>
            <v-spacer></v-spacer>
        </v-row>
    </v-container>
</template>

<script>
import BeatRangeItem from '../components/BPMCalculator/BeatRangeItem.vue'

export default {
    name: 'Calculator',
    components: {
        BeatRangeItem
    },
    data: () => ({
        BRPropItems : [],
        formStartTime: 0,
        formEndTime: 250
    }),
    methods: {
        addItem(){
            const newID = this.BRPropItems.length;
            console.log(newID);
            const newBRItem = {
                id: newID,
                startTime: Number(this.formStartTime),
                endTime: Number(this.formEndTime)
            };
            this.BRPropItems = [...this.BRPropItems, newBRItem];
        },
        itemClosed(id){
            console.log('Deleting Item id ' + id);
            this.BRPropItems = this.BRPropItems.filter(item => 
                item.id !== id
            );
        }
    }
}
</script>