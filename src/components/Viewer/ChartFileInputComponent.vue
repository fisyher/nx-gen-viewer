<template>
    <v-card
        >
        <v-card-title>Main Control</v-card-title>
        <v-card-text>
            <v-file-input
                show-size
                label="File input"
                accept=".dtx, .gda"
                @change="onFileChange"
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
    methods:{
        onFileChange(file){
            if(!file){
                console.log('File Input reset');
                return;
            }
            console.log(file);
            
            this.createDataObject(file);
        },
        createDataObject(file){
            const freader = new FileReader();
            const encoding = "Shift-JIS";
            freader.onload = (e) => {
                console.log(e.target);
                
            };
            freader.readAsText(file, encoding);
        }
    }
    
}
</script>

<style>

</style>