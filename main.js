(function () {
    'use strict';

    let active = false;
    let collectedASINs = [];
    let currentlyScraping = false;

    function createToggleButton() {
        const button = document.createElement("button");
        button.innerText = "Eklentiyi Aktif Et";
        button.style.position = "fixed";
        button.style.top = "10px";
        button.style.right = "10px";
        button.style.padding = "10px";
        button.style.zIndex = "9999";
        button.style.backgroundColor = "red";
        button.style.color = "white";
        button.style.border = "none";
        button.style.cursor = "pointer";
        button.style.borderRadius = "5px";
        document.body.appendChild(button);

        button.addEventListener("click", function () {
            active = !active;
            button.style.backgroundColor = active ? "green" : "red";
            button.innerText = active ? "Eklenti Aktif ✅" : "Eklentiyi Aktif Et";
            if (active) {
                openControlPanel();
            } else {
                currentlyScraping = false;
            }
        });
    }

    function openControlPanel() {
        document.getElementById("customPanel")?.remove();
        const panel = document.createElement("div");
        panel.id = "customPanel";
        panel.style.position = "fixed";
        panel.style.top = "50px";
        panel.style.left = "50%";
        panel.style.transform = "translateX(-50%)";
        panel.style.width = "400px";
        panel.style.backgroundColor = "white";
        panel.style.border = "2px solid black";
        panel.style.zIndex = "10000";
        panel.style.padding = "10px";
        panel.style.borderRadius = "8px";
        panel.style.boxShadow = "0 4px 8px rgba(0,0,0,0.2)";
        document.body.appendChild(panel);

        panel.innerHTML = `
            <h3 style="text-align:center;">ASIN Tarayıcı</h3>
            <div style="text-align:center;">
                <button id="startScraping" style="padding: 10px; font-size: 16px; background-color: blue; color: white; border: none; cursor: pointer; border-radius: 5px;">Taramayı Başlat</button>
            </div>
        `;
        document.getElementById("startScraping").addEventListener("click", startScraping);
    }

    function startScraping() {
        if (currentlyScraping) return;
        collectedASINs = [];
        currentlyScraping = true;

        let url = window.location.href;
        let sellerMatch = url.match(/me=([A-Z0-9]+)/);
        let marketplaceMatch = url.match(/marketplaceID=([A-Z0-9]+)/);

        if (sellerMatch && marketplaceMatch) {
            let sellerId = sellerMatch[1];
            let marketplaceId = marketplaceMatch[1];
            let newUrl = `https://www.amazon.co.uk/s?rh=p_6%3A${sellerId}&marketplaceID=${marketplaceId}`;
            openCategoryPage(newUrl);
        }
    }

    function openCategoryPage(url) {
        let newTab = window.open(url, "_blank");
        if (newTab) {
            newTab.onload = function () {
                newTab.postMessage({ action: "startScraping" }, "*");
            };
        }
    }

    window.addEventListener("message", function (event) {
        if (event.data.action === "startScraping") {
            scrapePages(event.origin, 1, 400);
        }
    });

    async function scrapePages(baseUrl, startPage, maxPages) {
        let pageNumbers = Array.from({ length: maxPages }, (_, i) => i + 1);
        let requests = pageNumbers.map(page => fetchASINs(`${baseUrl}&page=${page}`));

        let results = await Promise.all(requests);
        results.forEach(asins => collectedASINs.push(...asins));
        currentlyScraping = false;
        downloadResults();
    }

    async function fetchASINs(url) {
        try {
            let response = await fetch(url, { headers: { "User-Agent": navigator.userAgent } });
            let text = await response.text();
            let doc = new DOMParser().parseFromString(text, "text/html");
            let asinElements = doc.querySelectorAll("div[data-asin]");
            return Array.from(asinElements).map(el => el.getAttribute("data-asin")).filter(asin => asin);
        } catch (error) {
            console.error("Hata oluştu:", error);
            return [];
        }
    }

    function downloadResults() {
        let csvContent = "ASIN\n" + collectedASINs.join("\n");
        let blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        let link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "asins.csv";
        link.click();
    }

    createToggleButton();
})();
