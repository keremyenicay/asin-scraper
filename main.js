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
                    <button id="selectAllCategories" style="padding: 5px; margin: 5px; background-color: orange; color: white; border: none; cursor: pointer;">Hepsini Seç</button>
                    <button id="clearAllCategories" style="padding: 5px; margin: 5px; background-color: gray; color: white; border: none; cursor: pointer;">Seçimi Temizle</button>
                    <button id="startScraping" style="padding: 10px; font-size: 16px; background-color: blue; color: white; border: none; cursor: pointer;">Tarama Başlat</button>
                </div>
            </div>
        `;

        loadCategories();
        document.getElementById("selectAllCategories").addEventListener("click", selectAllCategories);
        document.getElementById("clearAllCategories").addEventListener("click", clearAllCategories);
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

    function selectAllCategories() {
        document.querySelectorAll("#categoryList input[type='checkbox']").forEach(checkbox => {
            checkbox.checked = true;
        });
    }

    function clearAllCategories() {
        document.querySelectorAll("#categoryList input[type='checkbox']").forEach(checkbox => {
            checkbox.checked = false;
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
        await Promise.all(categories.map(category => processCategory(category)));
        generateExcel();
    }

    async function processCategory(category) {
        let totalProducts = 0;
        const fetchPromises = [];

        for (let page = 1; page <= 400; page++) {
            const url = category.url + `&page=${page}`;
            fetchPromises.push(fetchASINs(url, category.name));
        }

        const results = await Promise.allSettled(fetchPromises);
        results.forEach(result => {
            if (result.status === "fulfilled") {
                collectedASINs.push(...result.value);
                totalProducts += result.value.length;
            }
        });

        updateProgress(category.name, totalProducts);
    }

    createToggleButton();
})();
