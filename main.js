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
                    <div style="margin-bottom: 20px;">
                        <label for="useDynamicDelay">Dinamik Gecikme:</label>
                        <input type="checkbox" id="useDynamicDelay" checked>
                        <span style="font-size: 12px; display: block; margin-top: 5px; color: #666;">Bot tespitini önlemek için gecikmeyi rastgele ayarlar</span>
                    </div>
                    <div style="margin-bottom: 20px;">
                        <label for="useRotatingHeaders">Farklı Headers Kullan:</label>
                        <input type="checkbox" id="useRotatingHeaders" checked>
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
        progressBox.style.maxHeight = "300px";
        progressBox.style.overflow = "auto";
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

    // User agent rotation için farklı user-agent'lar
    const userAgents = [
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/119.0",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Safari/605.1.15",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36",
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36"
    ];
    
    // Accept-Language rotation için farklı dil ayarları
    const acceptLanguages = [
        "tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7",
        "en-US,en;q=0.9,tr;q=0.8",
        "en-GB,en;q=0.9,tr-TR;q=0.8,tr;q=0.7",
        "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7",
        "de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7"
    ];

    async function scrapeCategory(url, category, maxPages) {
        let totalProducts = 0;
        let page = 1;
        let hasMorePages = true;
        const baseDelay = parseInt(document.getElementById("delayBetweenRequests").value) || 1000;
        const useDynamicDelay = document.getElementById("useDynamicDelay").checked;
        const useRotatingHeaders = document.getElementById("useRotatingHeaders").checked;
        let consecutiveErrors = 0;
        const maxConsecutiveErrors = 3;
        
        // İlerleme bilgisini saklamak için dizi
        let progressLog = [];

        while (hasMorePages && page <= maxPages && currentlyScraping) {
            // URL yapısını düzelt
            let pageUrl = url;
            if (url.includes('page=')) {
                // Eğer URL'de zaten page parametresi varsa, değerini güncelle
                pageUrl = url.replace(/page=\d+/, `page=${page}`);
            } else if (url.includes('?')) {
                // URL'de soru işareti varsa ancak page parametresi yoksa, ekle
                pageUrl = `${url}&page=${page}`;
            } else {
                // URL'de hiç parametre yoksa, page parametresini ekle
                pageUrl = `${url}?page=${page}`;
            }
            
            // İlerleme durumunu güncelle
            updateProgress(category, totalProducts, page, false, progressLog);
            
            try {
                // ASIN'leri çek
                const asins = await fetchASINsWithXHR(pageUrl, useRotatingHeaders);
                
                if (asins && asins.length > 0) {
                    const uniqueAsins = asins.filter(asin => asin && asin.trim() !== '');
                    totalProducts += uniqueAsins.length;
                    
                    // Her ASIN'i kategori bilgisiyle birlikte saklayalım
                    uniqueAsins.forEach(asin => {
                        // Sadece benzersiz ASIN'leri ekle
                        if (!collectedASINs.some(item => item.asin === asin)) {
                            collectedASINs.push({
                                asin: asin,
                                category: category,
                                page: page
                            });
                        }
                    });
                    
                    // İlerleme güncellemesi
                    progressLog.push(`Sayfa ${page}: ${uniqueAsins.length} ASIN bulundu`);
                    updateProgress(category, totalProducts, page, false, progressLog);
                    
                    // Başarılı istek olduğunda hata sayacını sıfırla
                    consecutiveErrors = 0;
                    page++;
                    
                    // Gecikme ekleme
                    if (page <= maxPages) {
                        let delay = baseDelay;
                        if (useDynamicDelay) {
                            // Rastgele gecikme ekle (0.7x - 1.5x arasında)
                            const randomFactor = 0.7 + Math.random() * 0.8; // 0.7 ile 1.5 arasında
                            delay = Math.floor(baseDelay * randomFactor);
                        }
                        await new Promise(resolve => setTimeout(resolve, delay));
                    }
                } else {
                    progressLog.push(`Sayfa ${page}: ASIN bulunamadı veya sayfa boş`);
                    updateProgress(category, totalProducts, page, false, progressLog);
                    hasMorePages = false;
                }
            } catch (error) {
                consecutiveErrors++;
                progressLog.push(`Sayfa ${page}: HATA - ${error.message || 'Bilinmeyen hata'}`);
                updateProgress(category, totalProducts, page, false, progressLog);
                
                if (consecutiveErrors >= maxConsecutiveErrors) {
                    progressLog.push(`${maxConsecutiveErrors} ardışık hata - tarama durduruluyor`);
                    updateProgress(category, totalProducts, page, false, progressLog);
                    hasMorePages = false;
                } else {
                    // Hata sonrası daha uzun bir bekleme ekle
                    const errorDelay = baseDelay * 2;
                    await new Promise(resolve => setTimeout(resolve, errorDelay));
                    // Sayfayı yeniden deneme - sayfa numarasını artırmadan
                }
            }
        }
        
        progressLog.push(`Kategori taraması tamamlandı!`);
        updateProgress(category, totalProducts, page - 1, true, progressLog);
    }

    function updateProgress(category, totalProducts, currentPage, completed = false, progressLog = []) {
        const progressBox = document.getElementById("progressBox");
        if (progressBox) {
            let logHtml = '';
            
            // En son 5 log mesajını göster
            const recentLogs = progressLog.slice(-5);
            if (recentLogs.length > 0) {
                logHtml = `<div style="margin-top: 10px; font-size: 12px; border-top: 1px solid #555; padding-top: 5px;">
                    ${recentLogs.map(log => `<div>${log}</div>`).join('')}
                </div>`;
            }
            
            progressBox.innerHTML = `
                Kategori: <b>${category}</b> <br>
                Sayfa: <b>${currentPage}</b> <br>
                Toplam ASIN: <b>${totalProducts}</b> <br>
                Toplam benzersiz ASIN: <b>${collectedASINs.length}</b> <br>
                ${completed ? "<span style='color: #4CAF50;'>✓ Kategori tamamlandı</span>" : ""}
                ${logHtml}
            `;
        }
    }

    function fetchASINsWithXHR(url, useRotatingHeaders = true) {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.onreadystatechange = function() {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                        try {
                            const parser = new DOMParser();
                            const doc = parser.parseFromString(xhr.responseText, "text/html");
                            
                            // Farklı ASIN seçicileri dene
                            let asinElements = doc.querySelectorAll("div[data-asin]");
                            if (asinElements.length === 0) {
                                asinElements = doc.querySelectorAll("[data-asin]");
                            }
                            
                            const asins = Array.from(asinElements)
                                .map(el => el.getAttribute("data-asin"))
                                .filter(asin => asin && asin.trim() !== '');
                            
                            resolve(asins);
                        } catch (error) {
                            reject(new Error("HTML ayrıştırma hatası"));
                        }
                    } else {
                        reject(new Error(`HTTP Hatası: ${xhr.status}`));
                    }
                }
            };
            
            xhr.onerror = function() {
                reject(new Error("Ağ hatası oluştu"));
            };
            
            xhr.timeout = 30000; // 30 saniye timeout
            xhr.ontimeout = function() {
                reject(new Error("İstek zaman aşımına uğradı"));
            };
            
            xhr.open("GET", url, true);
            
            if (useRotatingHeaders) {
                // Rastgele user-agent ve accept-language seç
                const randomUserAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
                const randomAcceptLanguage = acceptLanguages[Math.floor(Math.random() * acceptLanguages.length)];
                
                xhr.setRequestHeader("User-Agent", randomUserAgent);
                xhr.setRequestHeader("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8");
                xhr.setRequestHeader("Accept-Language", randomAcceptLanguage);
                xhr.setRequestHeader("Cache-Control", "no-cache");
                xhr.setRequestHeader("Pragma", "no-cache");
                
                // Referrer ekle - rastgele Amazon sayfası veya mevcut site
                const currentDomain = window.location.hostname;
                const possibleReferrers = [
                    `https://${currentDomain}/`,
                    `https://${currentDomain}/gp/bestsellers/`,
                    `https://${currentDomain}/stores/`,
                    `https://${currentDomain}/s?k=products`
                ];
                const randomReferrer = possibleReferrers[Math.floor(Math.random() * possibleReferrers.length)];
                xhr.setRequestHeader("Referer", randomReferrer);
            } else {
                // Standart header'lar
                xhr.setRequestHeader("User-Agent", navigator.userAgent);
                xhr.setRequestHeader("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8");
                xhr.setRequestHeader("Accept-Language", "tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7");
                xhr.setRequestHeader("Cache-Control", "no-cache");
            }
            
            xhr.send();
        });
    }

    function generateExcel() {
        // CSV header
        let csvContent = "ASIN,Kategori,Sayfa\n";
        
        // Her ASIN ve kategori bilgisini CSV'ye ekleyelim
        collectedASINs.forEach(item => {
            csvContent += `${item.asin},"${item.category}",${item.page || ''}\n`;
        });
        
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        
        // Tarih ve saat ekleyerek dosya adı oluştur
        const now = new Date();
        const dateStr = now.toISOString().slice(0, 10);
        const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '-');
        link.download = `amazon_asins_${dateStr}_${timeStr}.csv`;
        
        link.click();
    }

    createToggleButton();
})();
