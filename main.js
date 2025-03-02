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
                <div style="width: 50%; display: flex; justify-content: center; align-items: center;">
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

        const excludedCategories = [
            "4 Stars & Up & Up",
            "New",
            "Climate Pledge Friendly",
            "Amazon Global Store",
            "Include Out of Stock"
        ];

        document.querySelectorAll(".s-navigation-item").forEach(item => {
            const categoryName = item.innerText.trim();
            if (excludedCategories.includes(categoryName)) {
                return;
            }

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

    function startScraping() {
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
        processCategories(selectedCategories);
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
        const progressBox = document.getElementById("progressBox");
        if (progressBox) {
            progressBox.innerHTML = `Kategori: <b>${category}</b> <br> Toplam ASIN: ${totalProducts}`;
        }
    }

    async function processCategories(categories) {
        for (const category of categories) {
            let totalProducts = 0;
            let allASINs = [];

            for (let batchStart = 1; batchStart <= 400; batchStart += 10) {
                const batchPromises = [];

                for (let page = batchStart; page < batchStart + 10 && page <= 400; page++) {
                    const url = `${category.url}&page=${page}`;
                    batchPromises.push(fetchASINs(url, category.name));
                }

                const results = await Promise.all(batchPromises);
                results.forEach(asins => {
                    allASINs.push(...asins);
                    totalProducts += asins.length;
                });

                updateProgress(category.name, totalProducts);
            }

            collectedASINs.push(...allASINs);
        }
        generateExcel();
    }

    async function fetchASINs(url, categoryName) {
        try {
            const response = await fetch(url);
            const text = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(text, "text/html");

            const asinElements = doc.querySelectorAll("div[data-asin]:not([data-asin=''])");
            return [...asinElements].map(el => el.getAttribute("data-asin"));
        } catch (error) {
            console.error(`Hata: ${url}`, error);
            return [];
        }
    }

    function generateExcel() {
        const blob = new Blob([collectedASINs.join("\n")], { type: "text/plain" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "asin_list.txt";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    createToggleButton();
})();
