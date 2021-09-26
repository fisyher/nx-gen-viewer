<template>
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
</template>

<script>
export default {
    name: 'ChartFileInputComponent',
    
}
</script>

<style>

</style>