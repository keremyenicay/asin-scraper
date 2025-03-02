(function () {
    'use strict';

    let active = false;
    let collectedASINs = [];

    // Sayfa tamamen yüklendiğinde başlat
    window.onload = function() {
        console.log("✅ Sayfa yüklendi, script çalıştırılıyor.");
        initScript();
    };

    function initScript() {
        if (document.getElementById("toggleButton")) return;

        // Sağ üstte eklenti butonu ekleyelim
        const toggleButton = document.createElement("button");
        toggleButton.id = "toggleButton";
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
    }

    function openControlPanel() {
        if (document.getElementById("customPanel")) return;

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

    // Gizlenmesi gereken kategoriler
    const excludedCategories = [
        "4 Stars & Up & Up",
        "New",
        "All Discounts",
        "Climate Pledge Friendly",
        "Subscribe & Save",
        "Include Out of Stock"
    ];

    document.querySelectorAll(".s-navigation-item").forEach(item => {
        const categoryName = item.innerText.trim();
        if (excludedCategories.includes(categoryName)) {
            return; // Gereksiz kategorileri atla
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
        collectedASINs = [];
        let totalProducts = 0;

        console.log(`🚀 ${category.name} kategorisi için tarama başlatıldı...`);

        // İlk sayfadaki ASIN'leri al
        await fetchASINs(category.url, category.name);

        // Daha fazla ürün olup olmadığını kontrol et
        let nextPage = 2;
        let hasMorePages = true;

        while (hasMorePages && nextPage <= 400) {
            const nextPageUrl = category.url + `&page=${nextPage}`;
            const asins = await fetchASINs(nextPageUrl, category.name);

            if (asins.length === 0) {
                console.log(`⏹ ${category.name} kategorisi için daha fazla ürün bulunamadı. Sayfa: ${nextPage}`);
                hasMorePages = false; // Eğer ASIN bulunamazsa, taramayı durdur
            } else {
                totalProducts += asins.length;
                nextPage++;
            }

            updateProgress(category.name, totalProducts);
        }
    }

    generateExcel();
}

async function fetchASINs(url, categoryName) {
    try {
        console.log(`🔍 ${categoryName} | ${url} taranıyor...`);

        // Amazon'un sunduğu XHR veya Fetch API'yi kullanarak daha fazla ürün al
        const response = await fetch(url, { method: "GET" });
        const text = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, "text/html");
        const asins = [];

        // Ürünlerin bulunduğu öğeleri al
        doc.querySelectorAll("div[data-asin]").forEach(item => {
            const asin = item.getAttribute("data-asin");
            if (asin) asins.push(asin);
        });

        console.log(`✅ ${categoryName} | ${url} | ${asins.length} ASIN bulundu.`);
        return asins;
    } catch (error) {
        console.error(`❌ Hata (${categoryName} - ${url}):`, error);
        return [];
    }
}

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
