const errorCode = 10000;

const fatalErrorCheck = errorCode;

// fatal error check
let fatalErrorDetected = false;
let screenError = false;

if (fatalErrorCheck === 10000) {
  fatalErrorDetected = true;
}

// error message function
function fatalErrorMessage(timeout) {
  if (fatalErrorDetected) {
    setTimeout(() => {
      console.error('Fatal error detected. Please check the error code and resolve the issue.');
      screenError = true;
      console.log('Screen error status:', screenError);
    }, timeout);
  } else {
    console.log('No fatal errors detected.');
  }
}

fatalErrorMessage(2000);
setTimeout(() => {
  console.clear();
}, 7000);

module.exports = { screenError };