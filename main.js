(async function () {
    'use strict';

    let active = false;
    let collectedASINs = new Set();
    let categoryQueue = [];

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
        document.body.appendChild(button);

        button.addEventListener("click", function () {
            active = !active;
            button.style.backgroundColor = active ? "green" : "red";
            button.innerText = active ? "Eklenti Aktif ✅" : "Eklentiyi Aktif Et";
            if (active) {
                openControlPanel();
            } else {
                document.getElementById("customPanel")?.remove();
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
        panel.style.height = "500px";
        panel.style.backgroundColor = "white";
        panel.style.border = "2px solid black";
        panel.style.zIndex = "10000";
        panel.style.padding = "10px";
        panel.style.overflow = "hidden";
        document.body.appendChild(panel);

        panel.innerHTML = `
            <h3 style="text-align:center;">ASIN Tarayıcı</h3>
            <div style="display:flex; height: 90%;">
                <div id="categoryList" style="width: 50%; overflow-y: auto; border-right: 1px solid gray; padding: 10px;"></div>
                <div style="width: 50%; display: flex; flex-direction: column; justify-content: center; align-items: center;">
                    <button id="selectAll" style="margin-bottom: 10px; padding: 5px;">Hepsini Seç</button>
                    <button id="clearSelection" style="margin-bottom: 10px; padding: 5px;">Seçimi Temizle</button>
                    <button id="startScraping" style="padding: 10px; font-size: 16px; background-color: blue; color: white; border: none; cursor: pointer;">Tarama Başlat</button>
                </div>
            </div>
        `;
        loadCategories();
        document.getElementById("startScraping").addEventListener("click", startScraping);
        document.getElementById("selectAll").addEventListener("click", () => {
            document.querySelectorAll("#categoryList input").forEach(cb => cb.checked = true);
        });
        document.getElementById("clearSelection").addEventListener("click", () => {
            document.querySelectorAll("#categoryList input").forEach(cb => cb.checked = false);
        });
    }

    function loadCategories() {
        const categoryContainer = document.getElementById("categoryList");
        categoryContainer.innerHTML = "<b>Mağaza Kategorileri:</b><br>";
        document.querySelectorAll(".s-navigation-item").forEach(item => {
            const categoryName = item.innerText.trim();
            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.value = item.href;
            checkbox.dataset.name = categoryName;
            checkbox.style.marginRight = "5px";
            const label = document.createElement("label");
            label.textContent = categoryName;
            categoryContainer.appendChild(checkbox);
            categoryContainer.appendChild(label);
            categoryContainer.appendChild(document.createElement("br"));
        });
    }

    async function startScraping() {
        collectedASINs.clear();
        categoryQueue = [];
        document.querySelectorAll("#categoryList input:checked").forEach(checkbox => {
            categoryQueue.push({ url: checkbox.value, name: checkbox.dataset.name });
        });

        if (categoryQueue.length === 0) {
            alert("Lütfen en az bir kategori seçin!");
            return;
        }

        createProgressBox();
        await processCategories();
        generateExcel();
    }

    function createProgressBox() {
        const progressBox = document.createElement("div");
        progressBox.id = "progressBox";
        progressBox.style.position = "fixed";
        progressBox.style.bottom = "10px";
        progressBox.style.right = "10px";
        progressBox.style.backgroundColor = "black";
        progressBox.style.color = "white";
        progressBox.style.padding = "10px";
        progressBox.style.border = "1px solid white";
        progressBox.style.zIndex = "9999";
        document.body.appendChild(progressBox);
    }

    async function fetchASINsAjax(url) {
        try {
            const response = await fetch(url, { headers: { "X-Requested-With": "XMLHttpRequest" } });
            const json = await response.json();
            return json.results.map(item => item.asin);
        } catch (error) {
            console.error(`Hata: ${error}`);
            return [];
        }
    }

    async function processCategories() {
        for (let { url, name } of categoryQueue) {
            let page = 1;
            let hasMorePages = true;
            while (hasMorePages && page <= 400) {
                let ajaxUrl = `${url}&ajax=1&page=${page}`;
                let asins = await fetchASINsAjax(ajaxUrl);
                if (asins.length === 0) hasMorePages = false;
                asins.forEach(asin => collectedASINs.add(asin));
                updateProgress(name, collectedASINs.size);
                page++;
            }
        }
    }

    function generateExcel() {
        const blob = new Blob([Array.from(collectedASINs).join("\n")], { type: "text/csv" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "asins.csv";
        link.click();
    }

    createToggleButton();
})();
