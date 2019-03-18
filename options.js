function save_options() {
    
    var browserstrip = document.getElementById('browser-strip').checked;
    chrome.storage.sync.set({
      
        browserstrip: browserstrip
    }, function() {
      // Update status to let user know options were saved.
      var status = document.getElementById('status');
      status.textContent = 'Options saved. Changes will take effect the next time you restart the browser.';
      /*setTimeout(function() {
        status.textContent = '';
      }, 2000);
      */
    });
  }
  
  // Restores select box and checkbox state using the preferences
  // stored in chrome.storage.
  function restore_options() {
    // Use default value color = 'red' and likesColor = true.
    chrome.storage.sync.get({
      
        browserstrip: false
    }, function(items) {
      
      document.getElementById('browser-strip').checked = items.browserstrip;
    });
  }
  document.addEventListener('DOMContentLoaded', restore_options);
  document.getElementById('save').addEventListener('click',
      save_options);