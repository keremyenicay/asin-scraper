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
            const categoryURL = item.href;

            if (!categoryName || categoryName.includes("& Up") || categoryName.includes("New")) return;

            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.value = categoryURL;
            checkbox.dataset.name = categoryName;
            checkbox.style.marginRight = "5px";

            const label = document.createElement("label");
            label.textContent = categoryName;

            categoryContainer.appendChild(checkbox);
            categoryContainer.appendChild(label);
            categoryContainer.appendChild(document.createElement("br"));
        });
    }

    async function getSubCategories(categoryURL) {
        try {
            const response = await fetch(categoryURL);
            const text = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(text, "text/html");
            const subCategories = [];

            doc.querySelectorAll(".s-navigation-item").forEach(link => {
                if (link.href.includes("rh=n:")) {
                    subCategories.push(link.href);
                }
            });

            return subCategories.length ? subCategories : [categoryURL];
        } catch (error) {
            console.error("Alt kategorileri çekerken hata oluştu:", error);
            return [categoryURL];
        }
    }

    async function startScraping() {
        const selectedCategories = [];
        document.querySelectorAll("#categoryList input:checked").forEach(checkbox => {
            selectedCategories.push({
                url: checkbox.value,
                name: checkbox.dataset.name
            });
        });

        if (selectedCategories.length === 0) {
            alert("Lütfen en az bir kategori seçin!");
            return;
        }

        collectedASINs = [];
        document.getElementById("customPanel").remove();
        createProgressBox();

        for (const category of selectedCategories) {
            const subCategories = await getSubCategories(category.url);
            for (const subCategory of subCategories) {
                await processCategory(subCategory, category.name);
            }
        }

        generateExcel();
    }

    async function processCategory(categoryURL, categoryName) {
        let totalProducts = 0;
        let page = 1;

        while (page <= 400) {
            const url = `${categoryURL}&page=${page}`;
            const asins = await fetchASINs(url);
            collectedASINs.push(...asins);
            totalProducts += asins.length;
            updateProgress(categoryName, totalProducts);
            if (asins.length === 0) break;
            page++;
        }
    }

    function updateProgress(category, totalProducts) {
        document.getElementById("progressBox").innerHTML = `Kategori: <b>${category}</b> <br> Toplam ASIN: ${totalProducts}`;
    }

    async function fetchASINs(url) {
        try {
            const response = await fetch(url);
            const text = await response.text();
            const doc = new DOMParser().parseFromString(text, "text/html");
            return Array.from(doc.querySelectorAll("div[data-asin]")).map(el => el.getAttribute("data-asin"));
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
