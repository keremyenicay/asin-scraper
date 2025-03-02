(function () {
    'use strict';

    let active = false;
    let collectedASINs = [];
    let savedFilters = JSON.parse(localStorage.getItem("savedFilters")) || {};

    // Sağ üstte eklenti butonu ekleyelim
    const toggleButton = document.createElement("button");
    toggleButton.innerText = "Eklentiyi Aktif Et";
    toggleButton.style.position = "fixed";
    toggleButton.style.top = "10px";
    toggleButton.style.right = "10px";
    toggleButton.style.padding = "10px";
    toggleButton.style.zIndex = "9999";
    toggleButton.style.backgroundColor = "red";
    toggleButton.style.color = "white";
    toggleButton.style.border = "none";
    toggleButton.style.cursor = "pointer";
    document.body.appendChild(toggleButton);

    toggleButton.addEventListener("click", function () {
        active = !active;
        toggleButton.style.backgroundColor = active ? "green" : "red";
        toggleButton.innerText = active ? "Eklenti Aktif ✅" : "Eklentiyi Aktif Et";
        if (active) {
            openControlPanel();
        } else {
            document.getElementById("customPanel")?.remove();
        }
    });

    // Kontrol panelini aç
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
        panel.style.borderRadius = "10px";
        panel.style.boxShadow = "0px 0px 10px rgba(0, 0, 0, 0.2)";
        document.body.appendChild(panel);

        panel.innerHTML = `
            <h3 style="text-align:center; font-family: Arial, sans-serif;">ASIN Tarayıcı</h3>
            <div style="display:flex; height: 90%;">
                <div id="categoryList" style="width: 60%; overflow-y: auto; border-right: 1px solid gray; padding: 10px;"></div>
                <div style="width: 40%; padding: 10px;">
                    <h4>Filtre Yönetimi</h4>
                    <input type="text" id="filterName" placeholder="Filtre adı girin" style="width: 80%; padding: 5px;">
                    <button id="saveFilter" style="padding: 5px; background: green; color: white; border: none; cursor: pointer;">Kaydet</button>
                    <h4>Kaydedilmiş Filtreler</h4>
                    <select id="savedFiltersDropdown" style="width: 100%; padding: 5px;"></select>
                    <button id="loadFilter" style="margin-top: 5px; padding: 5px; background: blue; color: white; border: none; cursor: pointer;">Yükle</button>
                    <button id="startScraping" style="margin-top: 10px; padding: 10px; font-size: 16px; background-color: blue; color: white; border: none; cursor: pointer; width: 100%;">Tarama Başlat</button>
                </div>
            </div>
        `;

        loadCategories();
        loadSavedFilters();
        document.getElementById("startScraping").addEventListener("click", startScraping);
        document.getElementById("saveFilter").addEventListener("click", saveFilter);
        document.getElementById("loadFilter").addEventListener("click", loadFilter);
    }

    // Satıcının mağazasındaki kategorileri çek
    function loadCategories() {
        const categoryContainer = document.getElementById("categoryList");
        categoryContainer.innerHTML = "<b>Mağaza Kategorileri:</b><br>";

        document.querySelectorAll(".s-navigation-item").forEach(item => {
            const categoryName = item.innerText.trim();
            const excludedCategories = [
                "4 Stars & Up & Up",
                "New",
                "All Discounts",
                "Climate Pledge Friendly",
                "Amazon Global Store",
                "Include Out of Stock"
            ];
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

    // Kaydedilmiş filtreleri yükle
    function loadSavedFilters() {
        const dropdown = document.getElementById("savedFiltersDropdown");
        dropdown.innerHTML = "<option value=''>Filtre Seçin</option>";
        Object.keys(savedFilters).forEach(filterName => {
            const option = document.createElement("option");
            option.value = filterName;
            option.textContent = filterName;
            dropdown.appendChild(option);
        });
    }

    // Filtre kaydet
    function saveFilter() {
        const filterName = document.getElementById("filterName").value.trim();
        if (!filterName) return alert("Filtre adı giriniz!");

        const selectedCategories = [];
        document.querySelectorAll("#categoryList input:checked").forEach(checkbox => {
            selectedCategories.push({ url: checkbox.value, name: checkbox.dataset.name });
        });
        if (selectedCategories.length === 0) return alert("En az bir kategori seçmelisiniz!");

        savedFilters[filterName] = selectedCategories;
        localStorage.setItem("savedFilters", JSON.stringify(savedFilters));
        loadSavedFilters();
        alert("Filtre kaydedildi!");
    }

    // Filtre yükle
    function loadFilter() {
        const filterName = document.getElementById("savedFiltersDropdown").value;
        if (!filterName) return;
        const selectedCategories = savedFilters[filterName];
        document.querySelectorAll("#categoryList input").forEach(checkbox => {
            checkbox.checked = selectedCategories.some(cat => cat.url === checkbox.value);
        });
    }

})();
