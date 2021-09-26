<template>
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
</template>

<script>
export default {
    name: 'DrawOptionsComponent',
    data(){
        return {
            checkbox: true,
            selectedDiff: 'Basic',
            selectedFactor: '1.00',
            selectedHeight: '2000',
            selectedMode: 'XG/Gitadora',
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
}
</script>

<style>

</style>