(function () {
    'use strict';

    let active = false;
    let collectedASINs = [];

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

    // Satıcının mağazasındaki kategorileri çek
    function loadCategories() {
        const categoryContainer = document.getElementById("categoryList");
        categoryContainer.innerHTML = "<b>Mağaza Kategorileri:</b><br>";

        document.querySelectorAll(".s-navigation-item").forEach(item => {
            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.value = item.href; // Kategori linki
            checkbox.dataset.name = item.innerText.trim(); // Kategori adı
            checkbox.style.marginRight = "5px";

            const label = document.createElement("label");
            label.textContent = item.innerText.trim();

            categoryContainer.appendChild(checkbox);
            categoryContainer.appendChild(label);
            categoryContainer.appendChild(document.createElement("br"));
        });
    }

    // Tarama başlat
    function startScraping() {
        const selectedCategories = [];
        document.querySelectorAll("#categoryList input:checked").forEach(checkbox => {
            selectedCategories.push({
                url: checkbox.value,
                name: checkbox.dataset.name // Kategori adını al
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

    // Tarama durumu göstermek için kutu oluştur
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
            const fetchPromises = [];

            for (let page = 1; page <= 400; page++) {
                const url = category.url + `&page=${page}`;
                fetchPromises.push(fetchASINs(url, category.name));
            }

            // Paralel tarama (Çok hızlı!)
            const results = await Promise.all(fetchPromises);
            results.forEach(asins => {
                collectedASINs.push(...asins);
                totalProducts += asins.length;
            });

            updateProgress(category.name, totalProducts);
        }
        generateExcel();
    }

    // ASIN çekme fonksiyonu (Sayfa sayfa ilerlemeden, paralel çalışıyor!)
    async function fetchASINs(url, categoryName) {
        try {
            const response = await fetch(url, { method: "GET" });
            const text = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(text, "text/html");
            const asins = [];
            doc.querySelectorAll("div[data-asin]").forEach(item => {
                const asin = item.getAttribute("data-asin");
                if (asin) asins.push(asin);
            });
            updateProgress(categoryName, collectedASINs.length);
            return asins;
        } catch (error) {
            console.error("ASIN çekme hatası:", error);
            return [];
        }
    }

    // ASIN'leri CSV olarak indir
    function generateExcel() {
        let csvContent = "data:text/csv;charset=utf-8,ASIN\n";
        collectedASINs.forEach(asin => {
            csvContent += asin + "\n";
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "amazon_asins.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        alert("Tarama tamamlandı! ASIN'ler indirildi.");
    }
})();
