'use strict';
window.addEventListener('DOMContentLoaded', async function () {
    
    update_tabs().then(
        function (result) {
            document.getElementsByTagName("html")[0].style.setProperty('transform', 'translateY(42px)', "important");
            document.getElementsByTagName("html")[0].style.setProperty('margin-left', '0px', "important");
            document.getElementsByTagName("html")[0].style.setProperty('margin-right', '0px', "important");
            document.getElementById('colorfulTabsContainer').style.top = window.pageYOffset + 'px';
            chrome.runtime.sendMessage({
                initialized: "pls send all tabs"
            }, function (response) {});
        }).catch(function (err) {
        //console.log(err);
    });
});

chrome.runtime.onMessage.addListener(function (message, sender) {
    if(document.getElementById('colorfulTabsContainer') == null) {
        return;
    }
    if (message.tabs) { // We've received tabs

        render_tabs(message.tabs, sender)
    }
    if (message.scroll) {

        try {
            let colorfulTabsContainer = document.getElementById('colorfulTabsContainer').contentDocument;
            let tabstrip = colorfulTabsContainer.getElementById('tabstrip');
            tabstrip.scrollLeft = message.scroll;
        } catch (e) {
            //console.log(e);
        }
    }
    if (message.activate) {

        
        let colorfulTabsContainer = document.getElementById('colorfulTabsContainer').contentDocument;
        let tabstrip = colorfulTabsContainer.getElementById('tabstrip');
        let tabs = tabstrip.querySelectorAll('.tab');
        for (var i = 0; i < tabs.length; ++i) {
            tabs[i].setAttribute('active', 'false');
        }
        let active = colorfulTabsContainer.getElementById(message.activate);
        active.setAttribute('active', 'true');

        let selectedClr = active.getAttribute("data-ct-color");
        selectedClr = selectedClr.replace(";", "");
        colorfulTabsContainer = colorfulTabsContainer.getElementById('colorfulTabsTabBar')
        colorfulTabsContainer.style.borderBottom = "5px solid " + selectedClr;

        active.scrollIntoView({
            behavior: "instant",
            inline: "center",
            block: "center"
        });
    }
});

function render_tabs(message, sender) {
    let sat = 61;
    let lum = 73;
    update_tabs().then(
        function (result) {
            var tabbar = result;
            while (tabbar.hasChildNodes()) {
                tabbar.removeChild(tabbar.lastChild)
            }

            let tabstrippinned = document.createElement('span');
            tabstrippinned.id = 'tabstrippinned';
            tabstrippinned.className = 'tabstrippinned';
            tabbar.appendChild(tabstrippinned);

            let tabstrip = document.createElement('span');
            tabstrip.id = 'tabstrip';
            tabstrip.className = 'tabstrip';
            tabbar.appendChild(tabstrip);

            for (var i = 0; i < message.length; ++i) {
                let tab = document.createElement('span');
                tab.className = 'tab';
                tab.id = message[i].id;
                //console.log(message[i])
                let domain = new URL(message[i].url).hostname;
                var hue = genColor(domain);
                tab.setAttribute("data-ct-color", `hsl(${hue},${sat}%,${lum}%);`);
                var gradientstyle = `linear-gradient(hsla(0,0%,100%,.7),hsla(${hue},${sat}%,${lum}%,.5),hsla(${hue},${sat}%,${lum}%,1)),linear-gradient(hsla(${hue},${sat}%,${lum}%,1),hsla(${hue},${sat}%,${lum}%,1))`;
                tab.style = "background-image:" + gradientstyle;
                tab.setAttribute('active', message[i].active);
                let attribs = Object.keys(message[i]);
                tab.title = message[i].title;
                for (var a = 0; a < attribs.length; a++) {
                    if (message[i].hasOwnProperty(attribs[a])) {
                        tab.setAttribute("data-ct-" + attribs[a], message[i][attribs[a]]);
                    }
                }
                if (message[i].active == true) {
                    tabstrip.setAttribute('dataactive', message[i].id);
                }

                if (message[i].pinned == true) {
                    tabstrippinned.appendChild(tab);
                } else {
                    tabstrip.appendChild(tab);
                }
                tab.addEventListener('click', function (e) {
                    let element = e.target;
                    while (element.className != 'tab') {
                        element = element.parentElement;
                    }
                    //console.log(parseInt(element.getAttribute('id')));
                    chrome.runtime.sendMessage({
                        select: parseInt(element.getAttribute('id')),
                        scroll: tabstrip.scrollLeft
                    });
                });
                let tabicon = document.createElement('span');
                tabicon.className = 'icon';
                try {
                    tabicon.style.setProperty('background', 'url(' + message[i].favIconUrl + ') no-repeat center');
                } catch (e) {}
                tabicon.setAttribute('background-size', 'contain');
                tab.appendChild(tabicon);

                let tabtitle = document.createElement('span');
                tabtitle.className = 'title';
                tabtitle.innerHTML = message[i].title;
                tab.appendChild(tabtitle);

                let tabclose = document.createElement('span');
                tabclose.className = 'closebtn';
                tabclose.setAttribute('data-close-id', message[i].id);
                tab.appendChild(tabclose);
                tabclose.addEventListener('click', function (event) {
                    event.stopPropagation();
                    event.preventDefault();
                    let tabclose = this.getAttribute('data-close-id');
                    chrome.runtime.sendMessage({
                        close: tabclose
                    }, function (response) {});
                })
            }

            let body = document.getElementById('colorfulTabsContainer').contentDocument.body;
            body.addEventListener('contextmenu', event => event.preventDefault());

            let scrollleftbtn = document.createElement('span');
            scrollleftbtn.id = 'colorfultabs-go-left';
            scrollleftbtn.addEventListener('click', function () {
                tabstrip.scrollBy({
                    "behavior": "smooth",
                    "left": -500,
                    "top": 0
                });
            });
            tabbar.insertBefore(scrollleftbtn, tabbar.firstChild);

            let scrollrightbtn = document.createElement('span');
            scrollrightbtn.id = 'colorfultabs-go-right';
            scrollrightbtn.addEventListener('click', function () {
                tabstrip.scrollBy({
                    "behavior": "smooth",
                    "left": 500,
                    "top": 0
                });
            });
            tabbar.appendChild(scrollrightbtn);

            let newtabbtn = document.createElement('span');
            newtabbtn.id = 'colorfultabs-newtab';
            newtabbtn.addEventListener('click', function () {
                //console.log('someday this will open a new tab');
                chrome.runtime.sendMessage({
                    newtab: 'newtab'
                });
            });
            tabbar.appendChild(newtabbtn);

            let ct_window = colorfulTabsContainer.contentWindow;
            let ct_doc = colorfulTabsContainer.contentDocument;

            let posleft = parseInt(ct_window.getComputedStyle(ct_doc.getElementById('tabstrippinned'), null).getPropertyValue('width'));
            posleft = posleft + 32;
            tabstrip.style.left = posleft + 'px';
            tabstrip.style.maxWidth = 'calc(100% - ' + posleft + 'px - 64px)';

            let widthunpinned = ct_window.getComputedStyle(ct_doc.getElementById('tabstrip'), null).getPropertyValue('width');
            widthunpinned = parseInt(widthunpinned);
            widthunpinned = widthunpinned + posleft;
            newtabbtn.style.left = (widthunpinned + 1) + 'px';
           
            tabstrippinned.addEventListener("wheel", function (event, delta) {
                event.stopPropagation();
                event.preventDefault();

            }, true);

            tabstrip.addEventListener("wheel", function (event, delta) {
                if (event.deltaY) {
                    tabstrip.scrollBy({
                        "behavior": "auto",
                        "left": event.deltaY,
                        "top": 0
                    });
                    event.stopPropagation();
                    event.preventDefault();
                }
            }, true);

            let selected = tabstrip.querySelector('[active="true"]');
            let selectedClr = selected.getAttribute("data-ct-color");
            selectedClr = selectedClr.replace(";", "");
            result.style.borderBottom = "5px solid " + selectedClr;
            try {
                selected.scrollIntoView({
                    behavior: "instant",
                    inline: "center",
                    block: "center"
                });
            } catch (e) {}
        }).catch(function (err) {
        //console.log(err);
    });
}

window.addEventListener('scroll', function () {
    try {
        document.getElementById('colorfulTabsContainer').style.top = window.pageYOffset + 'px';
    } catch (e) {
        //console.log(e)
    }
});

async function update_tabs() {
    return new Promise(function (resolve, reject) {
        chrome.storage.sync.get({
            browserstrip: true
        }, function(items) {
            
            if (! items.browserstrip) {
                //console.log('not enabled');
                reject('not enabled');
            } else {
                let colorfulTabsContainer = document.getElementById('colorfulTabsContainer');
        if (colorfulTabsContainer == null) {
            colorfulTabsContainer = document.createElement('iframe');
            colorfulTabsContainer.setAttribute('id', 'colorfulTabsContainer');
            colorfulTabsContainer.setAttribute('frameborder', '0');
            colorfulTabsContainer.setAttribute('scrolling', 'no');
            colorfulTabsContainer.setAttribute('style', getTabBarStyle());
            colorfulTabsContainer.setAttribute('seamless', '');
            colorfulTabsContainer.setAttribute('srcdoc', '<html><head><style type="text/css">' + getCTabsStyle() + '</style><meta content="width=device-width; initial-scale=1.0; maximum-scale=1.0; user-scalable=0;" name="viewport" /></head><body><div id="colorfulTabsTabBar"></div></body></html>');
            document.body.appendChild(colorfulTabsContainer);
            colorfulTabsContainer.addEventListener("load", function () {
                resolve(colorfulTabsContainer.contentWindow.document.getElementById('colorfulTabsTabBar'));
            });
        } else {
            resolve(colorfulTabsContainer.contentWindow.document.getElementById('colorfulTabsTabBar'));
        }
            }
        });
        
    });
}

function getTabBarStyle() {
    var style = `
    box-shadow: 0px 0px 5px #000000ff;
    hsla(0,0%,50%) 1px 1px 1px;
background-color: transparent ;
height: 41px ;
position: fixed ;
z-index:9147483640;
bottom: auto;
border: 0 ;
left: 0px ;
width: 100% ;
box-sizing: content-box ;
display: block ;
overflow: hidden ;
opacity: 1 ;
margin: 0 0 0 0 ;
padding: 0 0 0 0 ;
transform: translateY(-42px);
`;
    return style;
}

function getCTabsStyle() {
    var style = `
    html, body {
        display: block;
        height: 100%;
        margin: 0;
        padding: 0;
        width: 100%;
    }
* {
    box-sizing: border-box;
}
body{
    -webkit-user-select: none;  
    -moz-user-select: none;    
    -ms-user-select: none;      
    user-select: none;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
    font-size: 12px;
    background:  #f2f2f2;
    border-bottom: 1px solid #b4b2b4;
    box-sizing: border-box;
    
}
#colorfulTabsTabBar {
    display: flex;
    flex-wrap: nowrap;
    justify-content: start;
    border-bottom: 4px solid transparent;
    pposition: absolute;
    bottom: 1px;
    width: 100%;
    height:40px;
}
.tabstrippinned{
    display: flex;
    position: fixed;
    width: min-content;
    z-index: 999;
    left: 32px;
}
.tabstrip {
    display:flex;
    position: fixed;
    overflow: hidden;
    border-left: 2px solid transparent;
}
.tab {
    padding: 8px 0px;
    display: flex;
    flex-wrap: nowrap;
    justify-content: space-evenly;
    max-width: 214px;
    min-width: 214px;
    width: 214px;
    overflow: hidden;
    white-space: nowrap;
    border-top-left-radius: 3px;
    border-top-right-radius: 3px;
    cursor: default;
    border-left: 1px solid #fff;
    border-top: 1px solid #fff;
    border-right: 1px solid #b4b2b4;
    border-bottom: 1px solid #b4b2b4;
    height: 35px;
    transition: all .3s linear;
    filter: brightness(100%) saturate(100%);
}

.tab[data-ct-pinned="true"] {
    min-width: 48px;
    width: 48px;
    max-width: 48px;
    position: relative;
}
.tab[data-ct-pinned="true"] .title {
    display:none;
}
.tab[data-ct-pinned="true"] .icon,
.tab[data-ct-pinned="true"] .closebtn {
    position: absolute;
    width: 16px;
    left: 0px;
    transition: .4s all 0s;
}
.tab[data-ct-pinned="true"] .icon {
    left: 16px;
}
.tab[data-ct-pinned="true"] .closebtn {
    width: 0px;
    left: 100px;
}
.tab[data-ct-pinned="true"]:hover .icon {
    left: 10px;
}
.tab[data-ct-pinned="true"]:hover .closebtn {
    width: 16px;
    left: 27px;
}
.tab[active="true"] {
    border-top: 1px solid red;
    border-bottom: none;
    position: relative;
    top: 1px;
}
.tab[active="true"] .title {
    font-weight: bold;
}
.tab:hover {
    filter: brightness(105%) saturate(150%);
}
.icon, .title, .closebtn {
    display: inline-block;
}
.icon {
    width: 16px;
    height: 16px;
    background-color: green;
    background-size: contain !important;
}
.title {
    display: inline-block;
    max-width: 150px;
    width: 150px;
    overflow: hidden;
}
.closebtn {
    width: 16px;
    height: 16px;
    background: transparent url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="16px" height="16px"><path fill-rule="evenodd"  fill="none" d="M8.000,-0.000 C12.418,-0.000 16.000,3.582 16.000,8.000 C16.000,12.418 12.418,16.000 8.000,16.000 C3.582,16.000 -0.000,12.418 -0.000,8.000 C-0.000,3.582 3.582,-0.000 8.000,-0.000 Z"/> <path fill-rule="evenodd"  fill="rgb(77, 77, 77)" d="M11.999,11.272 L11.272,11.999 L8.000,8.727 L4.728,11.999 L4.001,11.272 L7.273,8.000 L4.001,4.728 L4.728,4.001 L8.000,7.273 L11.272,4.001 L11.999,4.728 L8.727,8.000 L11.999,11.272 Z"/></svg>') no-repeat center;
    border-radius: 100%;
}
.closebtn:hover {
    background: transparent url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="16px" height="16px"><path fill-rule="evenodd"  fill="rgb(226, 92, 75)" d="M8.000,-0.000 C12.418,-0.000 16.000,3.582 16.000,8.000 C16.000,12.418 12.418,16.000 8.000,16.000 C3.582,16.000 -0.000,12.418 -0.000,8.000 C-0.000,3.582 3.582,-0.000 8.000,-0.000 Z"/><path fill-rule="evenodd"  fill="rgb(255, 255, 255)" d="M11.999,11.272 L11.272,11.999 L8.000,8.727 L4.728,11.999 L4.001,11.272 L7.273,8.000 L4.001,4.728 L4.728,4.001 L8.000,7.273 L11.272,4.001 L11.999,4.728 L8.727,8.000 L11.999,11.272 Z"/></svg>') no-repeat center;
}
#colorfultabs-go-left, #colorfultabs-go-right,#colorfultabs-newtab {
width: 32px;
height:32px;
min-width: 32px;
display: flex;
background-size: contain !important;
border: 5px solid transparent;
transition: .4s all 0s;
box-sizing: border-box;
position: fixed;
top:3px;
}
#colorfultabs-go-left {
    background: transparent url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="139px" height="321px"><path fill-rule="evenodd"  fill="rgb(204, 204, 204)" d="M0.008,160.508 L139.005,0.010 L139.005,321.005 L0.008,160.508 Z"/></svg>') no-repeat center;
}
#colorfultabs-go-right {
    right: 0px;
    background: transparent url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="139px" height="321px"><path fill-rule="evenodd"  fill="rgb(204, 204, 204)" d="M138.992,160.492 L-0.005,320.990 L-0.005,-0.005 L138.992,160.492 Z"/></svg>') no-repeat center;
}
#colorfultabs-newtab {
    background: hsl(0,0%,90%) url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="20px" height="20px"><path fill-rule="evenodd"  fill="rgb(77, 77, 77)" d="M20.000,11.000 L11.000,11.000 L11.000,20.000 L9.000,20.000 L9.000,11.000 L0.000,11.000 L0.000,9.000 L9.000,9.000 L9.000,0.000 L11.000,0.000 L11.000,9.000 L20.000,9.000 L20.000,11.000 Z"/></svg>') no-repeat center;
    background-size:16px !important;
    border-top-right-radius: 50%;
    border: 1px solid #00000022;
    top: 2px;
}
#colorfultabs-newtab:hover {
    background: transparent url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="20px" height="20px"><path fill-rule="evenodd"  fill="rgb(0, 0, 0)" d="M20.000,11.000 L11.000,11.000 L11.000,20.000 L9.000,20.000 L9.000,11.000 L0.000,11.000 L0.000,9.000 L9.000,9.000 L9.000,0.000 L11.000,0.000 L11.000,9.000 L20.000,9.000 L20.000,11.000 Z"/></svg>') no-repeat center;
}
#colorfultabs-go-left:hover {
    background: transparent url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="139px" height="321px"><path fill-rule="evenodd"  fill="rgb(104, 104, 104)" d="M0.008,160.508 L139.005,0.010 L139.005,321.005 L0.008,160.508 Z"/></svg>') no-repeat center;
}
#colorfultabs-go-right:hover {
    background: transparent url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="139px" height="321px"><path fill-rule="evenodd"  fill="rgb(104, 104, 104)" d="M138.992,160.492 L-0.005,320.990 L-0.005,-0.005 L138.992,160.492 Z"/></svg>') no-repeat center;
}
`;
    return style;
}

function genColor(data) {
    var hash = sha256(data.toString());
    var iClr, clrConst = 5381; // var clrString = ;
    for (iClr = 0; iClr < hash.length; iClr++) {
        clrConst = ((clrConst << 5) + clrConst) + hash.charCodeAt(iClr);
    }

    return Math.abs(clrConst) % 360;
}

// Generate a unique hash for a wider color spectrum
function sha256(s) {

    var chrsz = 8;
    var hexcase = 0;

    function safe_add(x, y) {
        var lsw = (x & 0xFFFF) + (y & 0xFFFF);
        var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
        return (msw << 16) | (lsw & 0xFFFF);
    }

    function S(X, n) {
        return (X >>> n) | (X << (32 - n));
    }

    function R(X, n) {
        return (X >>> n);
    }

    function Ch(x, y, z) {
        return ((x & y) ^ ((~x) & z));
    }

    function Maj(x, y, z) {
        return ((x & y) ^ (x & z) ^ (y & z));
    }

    function Sigma0256(x) {
        return (S(x, 2) ^ S(x, 13) ^ S(x, 22));
    }

    function Sigma1256(x) {
        return (S(x, 6) ^ S(x, 11) ^ S(x, 25));
    }

    function Gamma0256(x) {
        return (S(x, 7) ^ S(x, 18) ^ R(x, 3));
    }

    function Gamma1256(x) {
        return (S(x, 17) ^ S(x, 19) ^ R(x, 10));
    }

    function core_sha256(m, l) {
        var K = new Array(0x428A2F98, 0x71374491, 0xB5C0FBCF, 0xE9B5DBA5, 0x3956C25B, 0x59F111F1, 0x923F82A4, 0xAB1C5ED5, 0xD807AA98, 0x12835B01, 0x243185BE, 0x550C7DC3, 0x72BE5D74, 0x80DEB1FE, 0x9BDC06A7, 0xC19BF174, 0xE49B69C1, 0xEFBE4786, 0xFC19DC6, 0x240CA1CC, 0x2DE92C6F, 0x4A7484AA, 0x5CB0A9DC, 0x76F988DA, 0x983E5152, 0xA831C66D, 0xB00327C8, 0xBF597FC7, 0xC6E00BF3, 0xD5A79147, 0x6CA6351, 0x14292967, 0x27B70A85, 0x2E1B2138, 0x4D2C6DFC, 0x53380D13, 0x650A7354, 0x766A0ABB, 0x81C2C92E, 0x92722C85, 0xA2BFE8A1, 0xA81A664B, 0xC24B8B70, 0xC76C51A3, 0xD192E819, 0xD6990624, 0xF40E3585, 0x106AA070, 0x19A4C116, 0x1E376C08, 0x2748774C, 0x34B0BCB5, 0x391C0CB3, 0x4ED8AA4A, 0x5B9CCA4F, 0x682E6FF3, 0x748F82EE, 0x78A5636F, 0x84C87814, 0x8CC70208, 0x90BEFFFA, 0xA4506CEB, 0xBEF9A3F7, 0xC67178F2);
        var HASH = new Array(0x6A09E667, 0xBB67AE85, 0x3C6EF372, 0xA54FF53A, 0x510E527F, 0x9B05688C, 0x1F83D9AB, 0x5BE0CD19);
        var W = new Array(64);
        var a, b, c, d, e, f, g, h, i, j;
        var T1, T2;
        m[l >> 5] |= 0x80 << (24 - l % 32);
        m[((l + 64 >> 9) << 4) + 15] = l;
        for (var i = 0; i < m.length; i += 16) {
            a = HASH[0];
            b = HASH[1];
            c = HASH[2];
            d = HASH[3];
            e = HASH[4];
            f = HASH[5];
            g = HASH[6];
            h = HASH[7];
            for (var j = 0; j < 64; j++) {
                if (j < 16) W[j] = m[j + i];
                else W[j] = safe_add(safe_add(safe_add(Gamma1256(W[j - 2]), W[j - 7]), Gamma0256(W[j - 15])), W[j - 16]);
                T1 = safe_add(safe_add(safe_add(safe_add(h, Sigma1256(e)), Ch(e, f, g)), K[j]), W[j]);
                T2 = safe_add(Sigma0256(a), Maj(a, b, c));
                h = g;
                g = f;
                f = e;
                e = safe_add(d, T1);
                d = c;
                c = b;
                b = a;
                a = safe_add(T1, T2);
            }
            HASH[0] = safe_add(a, HASH[0]);
            HASH[1] = safe_add(b, HASH[1]);
            HASH[2] = safe_add(c, HASH[2]);
            HASH[3] = safe_add(d, HASH[3]);
            HASH[4] = safe_add(e, HASH[4]);
            HASH[5] = safe_add(f, HASH[5]);
            HASH[6] = safe_add(g, HASH[6]);
            HASH[7] = safe_add(h, HASH[7]);
        }
        return HASH;
    }

    function str2binb(str) {
        var bin = Array();
        var mask = (1 << chrsz) - 1;
        for (var i = 0; i < str.length * chrsz; i += chrsz) {
            bin[i >> 5] |= (str.charCodeAt(i / chrsz) & mask) << (24 - i % 32);
        }
        return bin;
    }

    function Utf8Encode(string) {
        string = string.replace(/\r\n/g, "\n");
        var utftext = "";
        for (var n = 0; n < string.length; n++) {
            var c = string.charCodeAt(n);
            if (c < 128) {
                utftext += String.fromCharCode(c);
            } else if ((c > 127) && (c < 2048)) {
                utftext += String.fromCharCode((c >> 6) | 192);
                utftext += String.fromCharCode((c & 63) | 128);
            } else {
                utftext += String.fromCharCode((c >> 12) | 224);
                utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                utftext += String.fromCharCode((c & 63) | 128);
            }
        }
        return utftext;
    }

    function binb2hex(binarray) {
        var hex_tab = hexcase ? "0123456789ABCDEF" : "0123456789abcdef";
        var str = "";
        for (var i = 0; i < binarray.length * 4; i++) {
            str += hex_tab.charAt((binarray[i >> 2] >> ((3 - i % 4) * 8 + 4)) & 0xF) +
                hex_tab.charAt((binarray[i >> 2] >> ((3 - i % 4) * 8)) & 0xF);
        }
        return str;
    }
    s = Utf8Encode(s);
    return binb2hex(core_sha256(str2binb(s), s.length * chrsz));
}