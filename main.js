(function () {
    'use strict';

    let active = false;
    let collectedASINs = [];
    
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
                    <button id="startScraping" style="padding: 10px; font-size: 16px; background-color: blue; color: white; border: none; cursor: pointer;">Tarama Başlat</button>
                </div>
            </div>
        `;
        loadCategories();
        document.getElementById("startScraping").addEventListener("click", startScraping);
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

    async function fetchSubcategories(categoryURL) {
        try {
            const response = await fetch(categoryURL);
            const text = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(text, "text/html");
            const subcategories = [];
            doc.querySelectorAll(".s-navigation-item").forEach(item => {
                subcategories.push(item.href);
            });
            return subcategories;
        } catch (error) {
            console.error("Alt kategori çekme hatası: ", error);
            return [];
        }
    }

    async function startScraping() {
        const selectedCategories = [];
        document.querySelectorAll("#categoryList input:checked").forEach(checkbox => {
            selectedCategories.push(checkbox.value);
        });

        if (selectedCategories.length === 0) {
            alert("Lütfen en az bir kategori seçin!");
            return;
        }

        collectedASINs = [];
        document.getElementById("customPanel").remove();
        for (const categoryURL of selectedCategories) {
            const subcategories = await fetchSubcategories(categoryURL);
            subcategories.unshift(categoryURL);
            for (const subcategoryURL of subcategories) {
                await processCategory(subcategoryURL);
            }
        }
        generateExcel();
    }

    async function processCategory(categoryURL) {
        let page = 1;
        let hasMorePages = true;
        while (hasMorePages && page <= 400) {
            const url = categoryURL + `&page=${page}`;
            const asins = await fetchASINs(url);
            if (asins.length === 0) {
                hasMorePages = false;
            }
            collectedASINs.push(...asins);
            page++;
        }
    }

    async function fetchASINs(url) {
        try {
            const response = await fetch(url);
            const text = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(text, "text/html");
            const asins = [];
            doc.querySelectorAll("div[data-asin]").forEach(el => {
                const asin = el.getAttribute("data-asin");
                if (asin) asins.push(asin);
            });
            return asins;
        } catch (error) {
            console.error("ASIN çekme hatası:", error);
            return [];
        }
    }

    function generateExcel() {
        const blob = new Blob([collectedASINs.join("\n")], { type: "text/csv" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "asins.csv";
        link.click();
    }

    createToggleButton();
})();
