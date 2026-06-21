const { fork } = require('child_process');

function startNebula() {
  console.log("The program may continue to boot... please wait");
  
  // Start the background process
  const child = fork('./nebulavm.js');

  // Listen for the process to exit
  child.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      console.warn("Sorry. NebulaVM has crashed.");
      console.warn("Reboot activated...");
      
      // Restart the application
      startNebula();
    } else {
      console.log("No errors detected. Clean exit.");
    }
  });
}

// Initial boot
startNebula();
