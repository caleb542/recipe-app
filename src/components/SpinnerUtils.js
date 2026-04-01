export function showSpinner() {
  const spinner = document.getElementById('spinner-container');
  if (spinner) {
    spinner.style.display = 'flex';
    spinner.style.opacity = '1';
  }
}

export function removeSpinner(minDisplayTime = 1000) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const spinner = document.getElementById('spinner-container');
      if (spinner) {
        spinner.style.transition = 'opacity 0.3s';
        spinner.style.opacity = '0';
        
        setTimeout(() => {
          spinner.style.display = 'none';
          resolve();
        }, 300);
      } else {
        resolve();
      }
    }, minDisplayTime);
  });
}