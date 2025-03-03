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
        panel.style.width = "600px";
        panel.style.backgroundColor = "white";
        panel.style.border = "2px solid black";
        panel.style.zIndex = "10000";
        panel.style.padding = "20px";
        panel.style.borderRadius = "12px";
        panel.style.boxShadow = "0 4px 8px rgba(0,0,0,0.3)";
        document.body.appendChild(panel);

        panel.innerHTML = `
            <h2 style="text-align:center;">ASIN Tarayıcı</h2>
            <div style="text-align:center; margin-bottom: 10px;">
                <button id="selectAll" style="margin-right: 10px; padding: 8px; border-radius: 5px; background-color: gray; color: white;">Hepsini Seç</button>
                <button id="clearSelection" style="padding: 8px; border-radius: 5px; background-color: gray; color: white;">Seçimi Temizle</button>
            </div>
            <div id="categoryList" style="margin-top: 10px; max-height: 300px; overflow-y: auto; border: 1px solid gray; padding: 10px; background: #f9f9f9; border-radius: 8px;"></div>
            <div style="text-align:center; margin-top: 10px;">
                <button id="startScraping" style="padding: 10px; font-size: 16px; background-color: blue; color: white; border: none; cursor: pointer; border-radius: 5px;">Taramayı Başlat</button>
            </div>
        `;
        document.getElementById("startScraping").addEventListener("click", startScraping);
        document.getElementById("selectAll").addEventListener("click", selectAllCategories);
        document.getElementById("clearSelection").addEventListener("click", clearSelection);
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

    function selectAllCategories() {
        document.querySelectorAll("#categoryList input").forEach(checkbox => checkbox.checked = true);
    }

    function clearSelection() {
        document.querySelectorAll("#categoryList input").forEach(checkbox => checkbox.checked = false);
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

        createProgressBox();
        processCategories(400);
    }

    function createProgressBox() {
        document.getElementById("progressBox")?.remove();
        const progressBox = document.createElement("div");
        progressBox.id = "progressBox";
        progressBox.style.position = "fixed";
        progressBox.style.bottom = "10px";
        progressBox.style.left = "10px";
        progressBox.style.backgroundColor = "black";
        progressBox.style.color = "white";
        progressBox.style.padding = "10px";
        progressBox.style.border = "1px solid white";
        progressBox.style.zIndex = "9999";
        progressBox.style.borderRadius = "5px";
        progressBox.style.minWidth = "250px";
        document.body.appendChild(progressBox);
    }

    function updateProgress(currentPage, totalProducts) {
        const progressBox = document.getElementById("progressBox");
        if (progressBox) {
            progressBox.innerHTML = `Sayfa: ${currentPage} / 400<br>Toplam Ürün: ${totalProducts}`;
        }
    }

    async function processCategories(maxPages) {
        let totalProducts = 0;
        while (categoryQueue.length > 0 && currentlyScraping) {
            let categoryUrl = categoryQueue.shift();
            for (let page = 1; page <= maxPages && currentlyScraping; page++) {
                let pageUrl = `${categoryUrl}&page=${page}`;
                let asins = await fetchASINs(pageUrl);
                totalProducts += asins.length;
                collectedASINs.push(...asins);
                updateProgress(page, totalProducts);
                if (asins.length === 0) break;
            }
        }
        currentlyScraping = false;
        downloadResults();
    }

    createToggleButton();
})();
