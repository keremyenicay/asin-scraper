(function () {
    'use strict';

    let active = false;
    let collectedASINs = [];
    let categoryQueue = [];
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
            <div id="categoryList" style="margin-top: 10px; max-height: 200px; overflow-y: auto; border: 1px solid gray; padding: 10px;"></div>
        `;
        document.getElementById("startScraping").addEventListener("click", startScraping);
        loadCategories();
    }

    function loadCategories() {
        const categoryContainer = document.getElementById("categoryList");
        categoryContainer.innerHTML = "<b>Mevcut Kategoriler:</b><br>";

        document.querySelectorAll(".s-navigation-item").forEach(item => {
            const categoryName = item.innerText.trim();
            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.value = item.href;
            checkbox.style.marginRight = "5px";

            const label = document.createElement("label");
            label.textContent = categoryName;

            categoryContainer.appendChild(checkbox);
            categoryContainer.appendChild(label);
            categoryContainer.appendChild(document.createElement("br"));
        });
    }

    function startScraping() {
        if (currentlyScraping) return;
        collectedASINs = [];
        categoryQueue = [];
        currentlyScraping = true;

        document.querySelectorAll("#categoryList input:checked").forEach(checkbox => {
            categoryQueue.push(checkbox.value);
        });

        if (categoryQueue.length === 0) {
            alert("Lütfen en az bir kategori seçin!");
            currentlyScraping = false;
            return;
        }

        processCategories(400);
    }

    async function processCategories(maxPages) {
        while (categoryQueue.length > 0 && currentlyScraping) {
            let categoryUrl = categoryQueue.shift();
            await scrapePages(categoryUrl, 1, maxPages);
        }
        currentlyScraping = false;
        downloadResults();
    }

    async function scrapePages(baseUrl, startPage, maxPages) {
        for (let page = startPage; page <= maxPages && currentlyScraping; page++) {
            let pageUrl = `${baseUrl}&page=${page}`;
            let asins = await fetchASINs(pageUrl);

            if (asins.length === 0) break;
            collectedASINs.push(...asins);
        }
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
