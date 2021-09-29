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
                //May trigger twice upon X
                console.log('File Input reset');
                this.$emit('file-reset');
                return;
            }
            console.log(file);
            
            this.createDataObject(file);
        },
        createDataObject(file){
            const freader = new FileReader();
            const encoding = "Shift-JIS";
            const arrayString = file.name.split(".");
            const extension = arrayString[arrayString.length - 1];
            freader.onload = (e) => {
                //console.log(e.target);
                this.$emit('file-loaded', e.target.result, extension);
            };
            freader.readAsText(file, encoding);
        }
    }
    
}
</script>

<style>

</style>