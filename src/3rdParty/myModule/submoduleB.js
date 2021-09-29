import { subModuleA } from "./submoduleA";


export const subModuleB = {
    ...subModuleA,
    functionSubB(){
        console.log('SubModuleB func called');
    }
}

