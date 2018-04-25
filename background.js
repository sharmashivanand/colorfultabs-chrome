'use strict';
var ColorfulTabsBG = {
    init() {
        chrome.runtime.onInstalled.addListener(function (details) {
            
            if (details.reason == "install") {
                chrome.tabs.create({
                    url: "https://www.addongenie.com/fr/colorfultabs?b=c&vi=" + chrome.runtime.getManifest().version,
                    active: true
                });
            }
            if (details.reason == "update") {
                // var thisVersion = chrome.runtime.getManifest().version;
                // details.previousVersion
                //chrome.tabs.create(null,null,"https://www.addongenie.com/fr/colorfultabs?vi=" + chrome.runtime.getManifest().version);
                chrome.tabs.create({
                    url: "https://www.addongenie.com/fr/colorfultabs?b=c&vu=" + chrome.runtime.getManifest().version,
                    active: true
                });
            }
        });
        chrome.runtime.onMessage.addListener(
            function(request, sender, sendResponse){
                //console.log(request);
                if(request.getoptions) {
                    chrome.tabs.sendMessage(sender.tab.id, {settings:"these will be the options"});
                }
                if(request.initialized){
                    ColorfulTabsBG.sendTabs(request, sender, sendResponse);
                }
                if(request.newtab){
                    chrome.tabs.create({
                        active: true
                    });
                }
                if(request.select){
                    ColorfulTabsBG.sendTabs(request, sender, sendResponse);
                }
                if(request.scroll){
                    chrome.tabs.query({currentWindow:true}, function (tabs) {
                        tabs = tabs.filter(tab => tab.id != sender.tab.id);
                        for (var i = 0; i < tabs.length; ++i) {
                            //chrome.tabs.sendMessage(tabs[i].id, {scroll:request.scroll,tabscrolled:sender.tab.id});
                        }
                    });
                }
                if(request.close){
                    ColorfulTabsBG.sendTabs(request, sender, sendResponse);
                }
            }
        );
        chrome.tabs.onCreated.addListener(ColorfulTabsBG.setBadge);
        chrome.tabs.onAttached.addListener(ColorfulTabsBG.setBadge);
        chrome.tabs.onDetached.addListener(ColorfulTabsBG.setBadge);
        chrome.tabs.onRemoved.addListener(ColorfulTabsBG.setBadge);
        
        chrome.tabs.onActivated.addListener(ColorfulTabsBG.activateTab);
        chrome.tabs.onCreated.addListener(ColorfulTabsBG.sendTabs);
        chrome.tabs.onAttached.addListener(ColorfulTabsBG.sendTabs);
        chrome.tabs.onDetached.addListener(ColorfulTabsBG.sendTabs);
        chrome.tabs.onRemoved.addListener(ColorfulTabsBG.sendTabs);
        chrome.tabs.onUpdated.addListener(ColorfulTabsBG.sendTabs);
        chrome.tabs.onUpdated.addListener(ColorfulTabsBG.sendTabs);
    },
    
    activateTab(activeInfo){
        chrome.tabs.sendMessage(activeInfo.tabId, {activate:activeInfo.tabId});
    },
    sendTabs(request, sender, sendResponse) {
        if (request.select) {
            //console.log('select' + request.select);
            chrome.tabs.update(parseInt(request.select), {
                active: true,
                highlighted: true
            });
        }
        if (request.close) {
            chrome.tabs.remove(parseInt(request.close), function () {});
        }
        chrome.tabs.query({currentWindow:true}, function (tabs) {
            tabs = tabs.filter(tab => tab.id != request.close);
            for (var i = 0; i < tabs.length; ++i) {
                chrome.tabs.sendMessage(tabs[i].id, {tabs:tabs});
            }
        });
    },
    setBadge() {
        chrome.windows.getCurrent({
            populate: true
        }, function (window) {
            chrome.browserAction.setBadgeText({
                text: window.tabs.length.toString()
            });
        });
    },
}

ColorfulTabsBG.init();
