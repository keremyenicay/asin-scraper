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
                document.getElementById("customPanel")?.remove();
                if (currentlyScraping) {
                    currentlyScraping = false;
                    document.getElementById("progressBox")?.remove();
                }
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
        panel.style.borderRadius = "8px";
        panel.style.boxShadow = "0 4px 8px rgba(0,0,0,0.2)";
        document.body.appendChild(panel);

        panel.innerHTML = `
            <h3 style="text-align:center;">ASIN Tarayıcı</h3>
            <div style="display:flex; height: 90%;">
                <div id="categoryList" style="width: 50%; overflow-y: auto; border-right: 1px solid gray; padding: 10px;"></div>
                <div style="width: 50%; display: flex; flex-direction: column; justify-content: center; align-items: center;">
                    <div style="margin-bottom: 20px;">
                        <label for="maxPages">Maksimum Sayfa Sayısı:</label>
                        <input type="number" id="maxPages" min="1" max="1000" value="400" style="width: 80px; margin-left: 10px;">
                    </div>
                    <div style="margin-bottom: 20px;">
                        <label for="delayBetweenRequests">Gecikmeli İstek (ms):</label>
                        <input type="number" id="delayBetweenRequests" min="0" max="5000" value="1000" style="width: 80px; margin-left: 10px;">
                    </div>
                    <button id="selectAll" style="margin-bottom: 10px; padding: 5px; width: 150px;">Hepsini Seç</button>
                    <button id="clearSelection" style="margin-bottom: 10px; padding: 5px; width: 150px;">Seçimi Temizle</button>
                    <button id="startScraping" style="padding: 10px; font-size: 16px; background-color: blue; color: white; border: none; cursor: pointer; width: 150px; border-radius: 5px;">Tarama Başlat</button>
                    <button id="stopScraping" style="padding: 10px; font-size: 16px; background-color: red; color: white; border: none; cursor: pointer; margin-top: 10px; width: 150px; border-radius: 5px; display: none;">Taramayı Durdur</button>
                </div>
            </div>
        `;
        loadCategories();
        document.getElementById("startScraping").addEventListener("click", startScraping);
        document.getElementById("stopScraping").addEventListener("click", stopScraping);
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

    function startScraping() {
        if (currentlyScraping) return;
        
        collectedASINs = [];
        categoryQueue = [];
        document.querySelectorAll("#categoryList input:checked").forEach(checkbox => {
            categoryQueue.push({ url: checkbox.value, name: checkbox.dataset.name });
        });

        if (categoryQueue.length === 0) {
            alert("Lütfen en az bir kategori seçin!");
            return;
        }

        const maxPages = parseInt(document.getElementById("maxPages").value) || 400;
        currentlyScraping = true;
        
        document.getElementById("startScraping").style.display = "none";
        document.getElementById("stopScraping").style.display = "block";
        
        createProgressBox();
        processCategories(maxPages);
    }

    function stopScraping() {
        currentlyScraping = false;
        categoryQueue = [];
        document.getElementById("startScraping").style.display = "block";
        document.getElementById("stopScraping").style.display = "none";
        
        const progressBox = document.getElementById("progressBox");
        if (progressBox) {
            progressBox.innerHTML += "<br><b>Tarama kullanıcı tarafından durduruldu!</b>";
        }
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
        progressBox.style.borderRadius = "5px";
        progressBox.style.minWidth = "250px";
        document.body.appendChild(progressBox);
    }

    async function processCategories(maxPages) {
        while (categoryQueue.length > 0 && currentlyScraping) {
            let { url, name } = categoryQueue.shift();
            await scrapeCategory(url, name, maxPages);
        }
        
        if (currentlyScraping) {
            generateExcel();
            const progressBox = document.getElementById("progressBox");
            if (progressBox) {
                progressBox.innerHTML += "<br><b>Tarama tamamlandı!</b>";
            }
            currentlyScraping = false;
            document.getElementById("startScraping").style.display = "block";
            document.getElementById("stopScraping").style.display = "none";
        }
    }

    async function scrapeCategory(url, category, maxPages) {
        let totalProducts = 0;
        let page = 1;
        let hasMorePages = true;
        const delayBetweenRequests = parseInt(document.getElementById("delayBetweenRequests").value) || 1000;

        while (hasMorePages && page <= maxPages && currentlyScraping) {
            const pageUrl = `${url}&page=${page}`;
            updateProgress(category, totalProducts, page);
            
            const asins = await fetchASINsWithXHR(pageUrl);
            
            if (asins.length > 0) {
                const uniqueAsins = asins.filter(asin => asin && asin.trim() !== '');
                totalProducts += uniqueAsins.length;
                
                // Her ASIN'i kategori bilgisiyle birlikte saklayalım
                uniqueAsins.forEach(asin => {
                    collectedASINs.push({
                        asin: asin,
                        category: category
                    });
                });
                
                updateProgress(category, totalProducts, page);
                page++;
                
                // İstek arasına gecikme ekleyelim
                if (delayBetweenRequests > 0 && page <= maxPages) {
                    await new Promise(resolve => setTimeout(resolve, delayBetweenRequests));
                }
            } else {
                hasMorePages = false;
            }
        }
        
        updateProgress(category, totalProducts, page - 1, true);
    }

    function updateProgress(category, totalProducts, currentPage, completed = false) {
        const progressBox = document.getElementById("progressBox");
        if (progressBox) {
            progressBox.innerHTML = `
                Kategori: <b>${category}</b> <br>
                Sayfa: <b>${currentPage}</b> <br>
                Toplam ASIN: <b>${totalProducts}</b> <br>
                ${completed ? "<span style='color: #4CAF50;'>✓ Kategori tamamlandı</span>" : ""}
            `;
        }
    }

    function fetchASINsWithXHR(url) {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.onreadystatechange = function() {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                        const parser = new DOMParser();
                        const doc = parser.parseFromString(xhr.responseText, "text/html");
                        const asinElements = doc.querySelectorAll("div[data-asin]");
                        const asins = Array.from(asinElements)
                            .map(el => el.getAttribute("data-asin"))
                            .filter(Boolean);
                        resolve(asins);
                    } else {
                        console.error(`XHR Hata: ${xhr.status}`);
                        resolve([]);
                    }
                }
            };
            
            xhr.open("GET", url, true);
            // Amazon'un bot olduğumuzu anlamasını zorlaştırmak için
            xhr.setRequestHeader("User-Agent", navigator.userAgent);
            xhr.setRequestHeader("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8");
            xhr.setRequestHeader("Accept-Language", "tr,en-US;q=0.7,en;q=0.3");
            xhr.setRequestHeader("Cache-Control", "no-cache");
            xhr.send();
        });
    }

    function generateExcel() {
        // CSV header
        let csvContent = "ASIN,Kategori\n";
        
        // Her ASIN ve kategori bilgisini CSV'ye ekleyelim
        collectedASINs.forEach(item => {
            csvContent += `${item.asin},"${item.category}"\n`;
        });
        
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `amazon_asins_${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
    }

    createToggleButton();
})();
