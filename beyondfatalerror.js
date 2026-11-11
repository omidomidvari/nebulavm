import { errorcode } from './errorcodes.js';
const errorcodetransfromimport = errorcode;

// backup script if all of Nebulavm crashes
// DO NOT DELETE THIS FILE, IT IS A BACKUP SCRIPT FOR NEBULAVM. IF DELETED, NEBULAVM WILL CLOSE AND DELETE EVERY .NVM .
// also, do not modify this script unless you are changing the error messages.

// error checking function

if (errorcodetransfromimport === undefined || errorcodetransfromimport === 11000) {
  console.error("NEBULAVM CRASH:");
  console.error("error code may be 11000 or undefined.");
  console.log(" we will now show you the errorcode.");
  setTimeout(() => {
    console.warn(errorcodetransfromimport);
  }, 1000);
}