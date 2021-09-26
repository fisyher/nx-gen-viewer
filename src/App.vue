<template>
  <v-app 
    
    >
    <v-app-bar app>                 
          <v-toolbar-title  > NX Gen Viewer </v-toolbar-title>
          
          <template v-slot:extension>
            <v-tabs
            align-with-title            
            optional
            v-model="tab"
            color="light-grey"
            >
              <v-tab
                v-for="item in items"
                :key="item.id"
                :to="{name: item.routeName}"
                replace
              >
                <v-icon>{{ item.icon }}</v-icon>{{item.title}}
              </v-tab>
            </v-tabs>
          </template>

          
          
     
      
    </v-app-bar>    

    <v-main>
      <!--Keep-alive ensures router view components do not get destroyed, only hidden from view -->
      <keep-alive>
      <router-view/>
      </keep-alive>
    </v-main>

    <v-footer app>
    <!-- -->
    <v-col
      class="text-center"
      cols="12"
    >
      Copyright {{ new Date().getFullYear() }} — <strong>NX Gen Viewer (Temp)</strong>
    </v-col>
    </v-footer>
  </v-app>  
</template>

<script>

export default {
  name: 'App',

  data: () => ({
    //:to="{name: item.routeName}"
    tab: 1,
    drawer: true,
    items: [
          {id:1, title: 'Main', icon: 'mdi-view-dashboard', routeName:'Home' },
          {id:2, title: 'Calculator', icon: 'mdi-calculator', routeName:'Calculator' },
          {id:3, title: 'About', icon: 'mdi-help-box', routeName:'About' },
        ],
    right: null
  }),
};
</script>
