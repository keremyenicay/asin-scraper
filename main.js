(function () {
    'use strict';

    let active = false;
    let collectedASINs = [];
    let categoryQueue = [];
    let currentlyScraping = false;
    let logMessages = [];

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
        panel.style.width = "700px";
        panel.style.height = "550px";
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
                <div style="width: 50%; display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 10px;">
                    <div style="margin-bottom: 15px; width: 100%;">
                        <label for="maxPages">Maksimum Sayfa Sayısı:</label>
                        <input type="number" id="maxPages" min="1" max="1000" value="400" style="width: 80px; margin-left: 10px;">
                    </div>
                    <div style="margin-bottom: 15px; width: 100%;">
                        <label for="initialDelay">Başlangıç Gecikmesi (ms):</label>
                        <input type="number" id="initialDelay" min="500" max="10000" value="1000" style="width: 80px; margin-left: 10px;">
                    </div>
                    <div style="margin-bottom: 15px; width: 100%;">
                        <label for="progressiveDelay">İlerleyici Gecikme Artışı (%):</label>
                        <input type="number" id="progressiveDelay" min="0" max="100" value="10" style="width: 80px; margin-left: 10px;">
                    </div>
                    <div style="margin-bottom: 15px; width: 100%;">
                        <label for="maxRetries">Yeniden Deneme Sayısı:</label>
                        <input type="number" id="maxRetries" min="0" max="10" value="3" style="width: 80px; margin-left: 10px;">
                    </div>
                    <div style="margin-bottom: 15px; width: 100%;">
                        <label for="paginationStrategy">Sayfalama Stratejisi:</label>
                        <select id="paginationStrategy" style="margin-left: 10px; width: 200px;">
                            <option value="standard">Standart (&page=N)</option>
                            <option value="ajaxified" selected>AJAX Format (JSON)</option>
                            <option value="hybrid">Hibrit (Otomatik Değiştir)</option>
                        </select>
                    </div>
                    <div style="margin-bottom: 15px; width: 100%;">
                        <label for="useRandomUserAgent">Rastgele User-Agent:</label>
                        <input type="checkbox" id="useRandomUserAgent" checked style="margin-left: 10px;">
                    </div>
                    <div style="display: flex; justify-content: center; gap: 10px; margin-bottom: 15px;">
                        <button id="selectAll" style="padding: 5px; width: 120px;">Hepsini Seç</button>
                        <button id="clearSelection" style="padding: 5px; width: 120px;">Seçimi Temizle</button>
                    </div>
                    <button id="startScraping" style="padding: 10px; font-size: 16px; background-color: blue; color: white; border: none; cursor: pointer; width: 150px; border-radius: 5px; margin-top: 10px;">Tarama Başlat</button>
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
        logMessages = [];
        document.querySelectorAll("#categoryList input:checked").forEach(checkbox => {
            categoryQueue.push({ url: checkbox.value, name: checkbox.dataset.name });
        });

        if (categoryQueue.length === 0) {
            alert("Lütfen en az bir kategori seçin!");
            return;
        }

        currentlyScraping = true;
        
        document.getElementById("startScraping").style.display = "none";
        document.getElementById("stopScraping").style.display = "block";
        
        createProgressBox();
        processCategories();
    }

    function stopScraping() {
        currentlyScraping = false;
        categoryQueue = [];
        document.getElementById("startScraping").style.display = "block";
        document.getElementById("stopScraping").style.display = "none";
        
        addToLog("<b>Tarama kullanıcı tarafından durduruldu!</b>", "warning");
        updateProgressBox();
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
        progressBox.style.width = "400px";
        progressBox.style.height = "300px";
        progressBox.style.display = "flex";
        progressBox.style.flexDirection = "column";
        
        // Status area (top)
        const statusArea = document.createElement("div");
        statusArea.id = "statusArea";
        statusArea.style.marginBottom = "10px";
        statusArea.style.borderBottom = "1px solid #444";
        statusArea.style.paddingBottom = "10px";
        
        // Log area (scrollable)
        const logArea = document.createElement("div");
        logArea.id = "logArea";
        logArea.style.flex = "1";
        logArea.style.overflowY = "auto";
        logArea.style.fontSize = "12px";
        
        progressBox.appendChild(statusArea);
        progressBox.appendChild(logArea);
        document.body.appendChild(progressBox);
    }

    function addToLog(message, type = "info") {
        const timestamp = new Date().toLocaleTimeString();
        let colorClass = "";
        switch(type) {
            case "success": colorClass = "color: #4CAF50;"; break;
            case "error": colorClass = "color: #F44336;"; break;
            case "warning": colorClass = "color: #FFC107;"; break;
            default: colorClass = "color: #FFFFFF;";
        }
        
        logMessages.unshift(`<div style="${colorClass}">[${timestamp}] ${message}</div>`);
        // Keep log size manageable
        if (logMessages.length > 100) {
            logMessages.pop();
        }
        updateProgressBox();
    }

    function updateProgressBox() {
        const statusArea = document.getElementById("statusArea");
        const logArea = document.getElementById("logArea");
        
        if (statusArea && logArea) {
            // Update log area
            logArea.innerHTML = logMessages.join("");
        }
    }

    function updateStatus(category, totalProducts, currentPage) {
        const statusArea = document.getElementById("statusArea");
        
        if (statusArea) {
            statusArea.innerHTML = `
                <div><b>Kategori:</b> ${category}</div>
                <div><b>Sayfa:</b> ${currentPage}</div>
                <div><b>Toplanan ASIN:</b> ${totalProducts}</div>
                <div><b>Toplam Kategoriler:</b> ${categoryQueue.length + 1} / ${document.querySelectorAll("#categoryList input:checked").length}</div>
            `;
        }
    }

    async function processCategories() {
        const maxPages = parseInt(document.getElementById("maxPages").value) || 400;
        
        while (categoryQueue.length > 0 && currentlyScraping) {
            const category = categoryQueue[0];
            addToLog(`"${category.name}" kategorisi taranmaya başlıyor...`, "info");
            await scrapeCategory(category.url, category.name, maxPages);
            categoryQueue.shift();
        }
        
        if (currentlyScraping) {
            generateExcel();
            addToLog("<b>Tüm kategoriler tarandı! CSV dosyası indirildi.</b>", "success");
            currentlyScraping = false;
            document.getElementById("startScraping").style.display = "block";
            document.getElementById("stopScraping").style.display = "none";
        }
    }

    async function scrapeCategory(url, category, maxPages) {
        let totalProducts = 0;
        let currentPage = 1;
        let retryCount = 0;
        let consecutiveEmptyPages = 0;
        const maxRetries = parseInt(document.getElementById("maxRetries").value) || 3;
        const initialDelay = parseInt(document.getElementById("initialDelay").value) || 1000;
        const progressiveDelayPercent = parseInt(document.getElementById("progressiveDelay").value) || 10;
        const paginationStrategy = document.getElementById("paginationStrategy").value || "hybrid";
        const useRandomUserAgent = document.getElementById("useRandomUserAgent").checked;
        
        // URL parçalama işlemi
        const urlInfo = parseAmazonUrl(url);
        
        // Her sayfa için alternatif talep yapısı kullanacağız
        while (currentPage <= maxPages && currentlyScraping) {
            updateStatus(category, totalProducts, currentPage);
            
            // Gecikme süresini hesapla (sayfa ilerledikçe artan)
            const currentDelay = calculateDelay(initialDelay, progressiveDelayPercent, currentPage);
            
            // URL oluştur
            let pageUrl;
            if (paginationStrategy === "standard" || (paginationStrategy === "hybrid" && currentPage <= 20)) {
                pageUrl = buildStandardUrl(urlInfo, currentPage);
                addToLog(`Sayfa ${currentPage}: Standart URL formatı kullanılıyor`, "info");
            } else {
                pageUrl = buildAjaxUrl(urlInfo, currentPage);
                addToLog(`Sayfa ${currentPage}: AJAX URL formatı kullanılıyor`, "info");
            }
            
            try {
                // User-Agent değiştirme seçeneği aktifse rastgele bir User-Agent kullan
                const userAgent = useRandomUserAgent ? getRandomUserAgent() : navigator.userAgent;
                
                // XHR talebi gönder
                const asins = await fetchASINsWithXHR(pageUrl, userAgent, currentDelay);
                
                if (asins.length > 0) {
                    // Başarılı sonuç aldık
                    consecutiveEmptyPages = 0;
                    retryCount = 0;
                    
                    const uniqueAsins = asins.filter(asin => asin && asin.trim() !== '');
                    const newAsinsCount = uniqueAsins.length;
                    totalProducts += newAsinsCount;
                    
                    // ASIN'leri kategorileriyle birlikte kaydet
                    uniqueAsins.forEach(asin => {
                        collectedASINs.push({
                            asin: asin,
                            category: category
                        });
                    });
                    
                    addToLog(`Sayfa ${currentPage}: ${newAsinsCount} ASIN bulundu (Toplam: ${totalProducts})`, "success");
                    
                    // Bir sonraki sayfaya geç
                    currentPage++;
                    
                    // İşlemi Amazon'un algılamaması için gerekli beklemeyi yap
                    await sleep(currentDelay);
                } else {
                    // Boş sayfa veya hata durumu
                    consecutiveEmptyPages++;
                    
                    if (consecutiveEmptyPages >= 3) {
                        // Üst üste 3 boş sayfa aldıysak, muhtemelen sayfaların sonuna geldik
                        addToLog(`${consecutiveEmptyPages} boş sayfa alındı - kategori taraması tamamlanıyor`, "warning");
                        break;
                    }
                    
                    if (retryCount < maxRetries) {
                        // Tekrar deneme
                        retryCount++;
                        const retryDelay = currentDelay * 2; // Tekrar denemelerde daha uzun bekle
                        addToLog(`Sayfa ${currentPage}: Boş yanıt - ${retryCount}/${maxRetries} tekrar deneniyor... (${retryDelay}ms bekliyor)`, "warning");
                        
                        // Pagination stratejisini değiştirmeyi dene
                        if (paginationStrategy === "hybrid") {
                            addToLog("Alternatif sayfalama stratejisi kullanılacak", "info");
                        }
                        
                        await sleep(retryDelay);
                    } else {
                        // Maksimum deneme sayısına ulaşıldı
                        addToLog(`Sayfa ${currentPage}: Maksimum yeniden deneme sayısına ulaşıldı`, "error");
                        
                        // Bir sonraki sayfayı dene, belki bu sayfa özelinde bir sorun vardır
                        currentPage++;
                        retryCount = 0;
                        await sleep(currentDelay);
                    }
                }
            } catch (error) {
                console.error(`Scraping error for page ${currentPage}:`, error);
                addToLog(`Sayfa ${currentPage}: Hata - ${error.message}`, "error");
                
                if (retryCount < maxRetries) {
                    // Tekrar deneme
                    retryCount++;
                    const retryDelay = currentDelay * 2;
                    addToLog(`Sayfa ${currentPage}: ${retryCount}/${maxRetries} tekrar deneniyor... (${retryDelay}ms bekliyor)`, "warning");
                    await sleep(retryDelay);
                } else {
                    // Maksimum deneme sayısına ulaşıldı
                    addToLog(`Sayfa ${currentPage}: Maksimum yeniden deneme sayısına ulaşıldı, sonraki sayfaya geçiliyor`, "error");
                    currentPage++;
                    retryCount = 0;
                    await sleep(currentDelay);
                }
            }
        }
        
        addToLog(`"${category}" kategorisi tamamlandı. Toplam ${totalProducts} ASIN toplandı.`, "success");
        return totalProducts;
    }

    function parseAmazonUrl(url) {
        try {
            const urlObj = new URL(url);
            const params = new URLSearchParams(urlObj.search);
            
            return {
                baseUrl: urlObj.origin + urlObj.pathname,
                host: urlObj.hostname,
                merchantId: params.get('me') || '',
                marketplaceID: params.get('marketplaceID') || '',
                rh: params.get('rh') || '',
                i: params.get('i') || 'merchant-items',
                dc: params.get('dc') !== null,
                qid: params.get('qid') || getRandomQid(),
                rnid: params.get('rnid') || '',
                ref: params.get('ref') || 'sr_nr_n_1',
                ds: params.get('ds') || ''
            };
        } catch (e) {
            console.error("URL parsing error:", e);
            // Fallback to minimal parsing
            return {
                baseUrl: url.split('?')[0],
                host: new URL(url).hostname,
                qid: getRandomQid()
            };
        }
    }

    function buildStandardUrl(urlInfo, page) {
        // Standard Amazon pagination format
        const params = new URLSearchParams();
        if (urlInfo.i) params.append('i', urlInfo.i);
        if (urlInfo.merchantId) params.append('me', urlInfo.merchantId);
        if (urlInfo.rh) params.append('rh', urlInfo.rh);
        if (urlInfo.dc) params.append('dc', '');
        if (urlInfo.marketplaceID) params.append('marketplaceID', urlInfo.marketplaceID);
        if (urlInfo.qid) params.append('qid', urlInfo.qid);
        params.append('refresh', '1');
        if (urlInfo.rnid) params.append('rnid', urlInfo.rnid);
        if (urlInfo.ref) params.append('ref', urlInfo.ref);
        if (urlInfo.ds) params.append('ds', urlInfo.ds);
        params.append('page', page.toString());
        
        return `${urlInfo.baseUrl}?${params.toString()}`;
    }

    function buildAjaxUrl(urlInfo, page) {
        // AJAX format with timestamp to prevent caching
        const timestamp = new Date().getTime();
        const params = new URLSearchParams();
        if (urlInfo.i) params.append('i', urlInfo.i);
        if (urlInfo.merchantId) params.append('me', urlInfo.merchantId);
        if (urlInfo.rh) params.append('rh', urlInfo.rh);
        if (urlInfo.dc) params.append('dc', '');
        if (urlInfo.marketplaceID) params.append('marketplaceID', urlInfo.marketplaceID);
        params.append('qid', urlInfo.qid || getRandomQid());
        params.append('refresh', '1');
        if (urlInfo.rnid) params.append('rnid', urlInfo.rnid);
        params.append('ref', 'sr_nr_n_1');
        if (urlInfo.ds) params.append('ds', urlInfo.ds);
        params.append('page', page.toString());
        params.append('_', timestamp.toString());
        
        return `${urlInfo.baseUrl}?${params.toString()}`;
    }

    function getRandomQid() {
        // Generate a random QID similar to Amazon's format
        return Math.floor(Math.random() * 1000000000).toString();
    }

    function calculateDelay(initialDelay, progressivePercent, pageNumber) {
        // Calculate progressive delay that increases with page number
        const multiplier = 1 + (Math.min(pageNumber, 100) - 1) * (progressivePercent / 100);
        return Math.round(initialDelay * multiplier);
    }

    function getRandomUserAgent() {
        // Common user agent strings
        const userAgents = [
            // Chrome on Windows
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36",
            // Firefox on Windows
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:90.0) Gecko/20100101 Firefox/90.0",
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0",
            // Edge on Windows
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.59",
            // Safari on Mac
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15",
            // Chrome on Mac
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36",
            // Firefox on Mac
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:89.0) Gecko/20100101 Firefox/89.0",
            // Mobile
            "Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1",
            "Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36"
        ];
        
        return userAgents[Math.floor(Math.random() * userAgents.length)];
    }

    function fetchASINsWithXHR(url, userAgent, timeout = 15000) {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.onreadystatechange = function() {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                        try {
                            const parser = new DOMParser();
                            const doc = parser.parseFromString(xhr.responseText, "text/html");
                            
                            // Try several selectors for ASIN extraction
                            let asinElements = doc.querySelectorAll("[data-asin]");
                            
                            // If no ASINs found with the primary selector, try alternative selectors
                            if (asinElements.length === 0) {
                                asinElements = doc.querySelectorAll(".s-result-item");
                            }
                            
                            if (asinElements.length === 0) {
                                asinElements = doc.querySelectorAll("[data-component-id]");
                            }
                            
                            const asins = [];
                            asinElements.forEach(el => {
                                let asin = el.getAttribute("data-asin");
                                if (!asin) {
                                    asin = el.getAttribute("data-component-id");
                                }
                                
                                // Extract ASIN from HREF if not found by other methods
                                if (!asin && el.querySelector("a")) {
                                    const href = el.querySelector("a").getAttribute("href");
                                    if (href) {
                                        const asinMatch = href.match(/\/dp\/([A-Z0-9]{10})/);
                                        if (asinMatch && asinMatch[1]) {
                                            asin = asinMatch[1];
                                        }
                                    }
                                }
                                
                                if (asin && /^[A-Z0-9]{10}$/.test(asin)) {
                                    asins.push(asin);
                                }
                            });
                            
                            // Log raw HTML response for debugging when no ASINs found
                            if (asins.length === 0) {
                                console.log("No ASINs found in response. Response length:", xhr.responseText.length);
                                // Check if we got redirected to a captcha page
                                if (xhr.responseText.includes("captcha") || xhr.responseText.includes("Captcha") || 
                                    xhr.responseText.includes("robot") || xhr.responseText.includes("Robot")) {
                                    reject(new Error("Captcha detected - scraping was blocked"));
                                    return;
                                }
                            }
                            
                            resolve(asins);
                        } catch (e) {
                            console.error("Error parsing response:", e);
                            reject(e);
                        }
                    } else {
                        reject(new Error(`HTTP error: ${xhr.status}`));
                    }
                }
            };
            
            xhr.open("GET", url, true);
            xhr.timeout = timeout;
            
            // Set headers to mimic a browser
            xhr.setRequestHeader("User-Agent", userAgent);
            xhr.setRequestHeader("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8");
            xhr.setRequestHeader("Accept-Language", "tr,en-US;q=0.7,en;q=0.3");
            xhr.setRequestHeader("Referer", new URL(url).origin + "/");
            xhr.setRequestHeader("DNT", "1");
            xhr.setRequestHeader("Connection", "keep-alive");
            xhr.setRequestHeader("Upgrade-Insecure-Requests", "1");
            xhr.setRequestHeader("Cache-Control", "max-age=0");
            
            xhr.ontimeout = function() {
                reject(new Error("Request timed out"));
            };
            
            xhr.onerror = function() {
                reject(new Error("Network error occurred"));
            };
            
            xhr.send();
        });
    }

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function generateExcel() {
        // Remove duplicates before generating CSV
        const uniqueASINs = [];
        const seenASINs = new Set();
        
        collectedASINs.forEach(item => {
            if (!seenASINs.has(item.asin)) {
                seenASINs.add(item.asin);
                uniqueASINs.push(item);
            }
        });
        
        // CSV header
        let csvContent = "ASIN,Kategori\n";
        
        // Add each ASIN and category to CSV
        uniqueASINs.forEach(item => {
            csvContent += `${item.asin},"${item.category}"\n`;
        });
        
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `amazon_asins_${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
        
        addToLog(`CSV dosyası oluşturuldu: ${uniqueASINs.length} benzersiz ASIN`, "success");
    }

    createToggleButton();
})();
