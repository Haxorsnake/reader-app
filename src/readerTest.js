document.addEventListener("DOMContentLoaded", function(event) { 
    let paraBr = document.querySelectorAll('p br');
    paraBr.forEach(element => {
        element.parentElement.style.display = 'none';
    });
  });