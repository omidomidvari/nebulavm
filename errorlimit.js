// error limiting program
import { errorcode } from './errorcodes.js';
const errorcodelimit = 11000;


    if (error >= errorcodelimit || error === undefined) {
     console.warn("error 11000 or undefined error has been deteced.")   
     require('./beyondfatalerror.js')
}
