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
        document.body.appendChild(panel);

        panel.innerHTML = `
            <h3 style="text-align:center;">ASIN Tarayıcı</h3>
            <button id="selectAll" style="margin-bottom: 10px;">Hepsini Seç</button>
            <button id="clearSelection" style="margin-bottom: 10px;">Seçimi Temizle</button>
            <div id="categoryList" style="max-height: 300px; overflow-y: auto;"></div>
            <button id="startScraping" style="margin-top: 10px; padding: 10px; width: 100%; background-color: blue; color: white;">Tarama Başlat</button>
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

        const excludedCategories = [
            "4 Stars & Up & Up", "New", "Climate Pledge Friendly", "Amazon Global Store", "Include Out of Stock"
        ];

        document.querySelectorAll(".s-navigation-item").forEach(item => {
            const categoryName = item.innerText.trim();
            if (excludedCategories.includes(categoryName)) return;

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
        const selectedCategories = Array.from(document.querySelectorAll("#categoryList input:checked")).map(cb => ({
            url: cb.value,
            name: cb.dataset.name
        }));

        if (!selectedCategories.length) {
            alert("Lütfen en az bir kategori seçin!");
            return;
        }

        collectedASINs = [];
        document.getElementById("customPanel").remove();
        createProgressBox();
        await processCategories(selectedCategories);
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

    function updateProgress(category, totalProducts) {
        document.getElementById("progressBox").innerHTML = `Kategori: <b>${category}</b> <br> Toplam ASIN: ${totalProducts}`;
    }

    async function processCategories(categories) {
        for (const category of categories) {
            let totalProducts = 0;
            for (let page = 1; page <= 400; page++) {
                const url = `${category.url}&page=${page}`;
                const asins = await fetchASINs(url);
                collectedASINs.push(...asins);
                totalProducts += asins.length;
                updateProgress(category.name, totalProducts);
                if (asins.length === 0) break;
            }
        }
        generateExcel();
    }

    async function fetchASINs(url) {
        try {
            const response = await fetch(url);
            const text = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(text, "text/html");
            return Array.from(doc.querySelectorAll("[data-asin]"))
                .map(el => el.getAttribute("data-asin"))
                .filter(asin => asin);
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
