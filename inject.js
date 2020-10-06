function injectScript(file, node) {
    var th = document.getElementsByTagName(node)[0];
    var s = document.createElement('script');
    s.setAttribute('type', 'text/javascript');
    s.setAttribute('src', file);
    th.appendChild(s);
}
injectScript( chrome.extension.getURL('/main.js'), 'body');
injectScript( chrome.extension.getURL('/lib/FileSaver-2.0.4.min.js'), 'body');
