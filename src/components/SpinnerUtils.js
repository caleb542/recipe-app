// spinnerUtils.js (or add to functions.js)

export function appendSpinner(container = 'container') {
  
  if (!container) return;
  
  const spinner = document.createElement('div');
  spinner.id = 'spinner';
  spinner.innerHTML = `<div class="bouncing-loader" role="status" aria-label="Loading">
                        <span></span>
                        <span></span>
                        <span></span>
                        <span></span>
                        <span class="loader-sr-only">Loading...</span>
                      </div>
  `
      // spinner.innerHTML =  `
      // <div class="spinner-container">
      //                           <div class="spinner-container__outer">
      //                               <div class="spinner-column"></div>
      //                               <div class="spinner-container__inner">
      //                                   <p>LOADING</p>
                                      
      //                               </div>
      //                           </div>
      //                       </div>
      //                       `;
                
   container.appendChild(spinner);                            

}

export function removeSpinner(minDisplayTime = 1000) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const spinner = document.getElementById('spinner');
      if (spinner) {
        spinner.style.transition = 'opacity 0.3s';
        spinner.style.opacity = '0';
        
        setTimeout(() => {
          spinner.remove();
          resolve();
        }, 300);
      } else {
        resolve();
      }
    }, minDisplayTime);
  });
}