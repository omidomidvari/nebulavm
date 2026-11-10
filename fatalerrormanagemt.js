import { screenerror } from "./fatalerror.js";

// simply, reroute to the error screen
let errorfatalcomplete = false;
if (screenerror === true) {
// do errorscreen rerouting
errorfatalcomplete = true;
screenerror = false;
require('./crashscreen.js');
// do not continue with the rest of the code
}
