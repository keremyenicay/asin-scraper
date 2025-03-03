(function () {
    'use strict';

    let active = false;
    let collectedASINs = [];
    let categoryQueue = [];
    let currentlyScraping = false;
    let logMessages = [];
    let currentDelay = 1000;
    let pageCheckStatus = {};

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
                        <input type="number" id="initialDelay" min="1000" max="10000" value="2000" style="width: 80px; margin-left: 10px;">
                    </div>
                    <div style="margin-bottom: 15px; width: 100%;">
                        <label for="progressiveDelay">İlerleyici Gecikme Artışı (%):</label>
                        <input type="number" id="progressiveDelay" min="0" max="100" value="15" style="width: 80px; margin-left: 10px;">
                    </div>
                    <div style="margin-bottom: 15px; width: 100%;">
                        <label for="maxRetries">Yeniden Deneme Sayısı:</label>
                        <input type="number" id="maxRetries" min="0" max="10" value="3" style="width: 80px; margin-left: 10px;">
                    </div>
                    <div style="margin-bottom: 15px; width: 100%;">
                        <label for="pageCheckMode">Sayfa Kontrol Modu:</label>
                        <select id="pageCheckMode" style="margin-left: 10px; width: 200px;">
                            <option value="sequential">Sıralı Kontrol</option>
                            <option value="binary" selected>İkili Arama</option>
                        </select>
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
        pageCheckStatus = {};
        
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

    function updateStatus(category, pageInfo, totalProducts) {
        const statusArea = document.getElementById("statusArea");
        
        if (statusArea) {
            statusArea.innerHTML = `
                <div><b>Kategori:</b> ${category}</div>
                <div><b>Sayfa Kontrol:</b> ${pageInfo}</div>
                <div><b>Toplanan ASIN:</b> ${totalProducts}</div>
                <div><b>Kalan Kategoriler:</b> ${categoryQueue.length} / ${document.querySelectorAll("#categoryList input:checked").length}</div>
            `;
        }
    }

    async function processCategories() {
        while (categoryQueue.length > 0 && currentlyScraping) {
            const category = categoryQueue[0];
            addToLog(`"${category.name}" kategorisi taranmaya başlıyor...`, "info");
            await findValidPages(category.url, category.name);
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

    async function findValidPages(categoryUrl, categoryName) {
        const maxPages = parseInt(document.getElementById("maxPages").value) || 400;
        const pageCheckMode = document.getElementById("pageCheckMode").value;
        let validPages = [];
        
        if (pageCheckMode === "binary") {
            // Binary search to efficiently find the last valid page
            let left = 1;
            let right = maxPages;
            
            addToLog(`İkili arama ile geçerli sayfa sayısı tespit ediliyor (1-${maxPages})...`, "info");
            
            while (left <= right && currentlyScraping) {
                let mid = Math.floor((left + right) / 2);
                updateStatus(categoryName, `Sayfa ${mid} kontrol ediliyor (Aralık: ${left}-${right})`, collectedASINs.length);
                
                const pageExists = await checkPageExists(categoryUrl, mid);
                
                if (pageExists) {
                    left = mid + 1;
                    addToLog(`Sayfa ${mid} mevcut. Üst sınırı kontrol ediyorum...`, "success");
                } else {
                    right = mid - 1;
                    addToLog(`Sayfa ${mid} mevcut değil. Alt sınırı kontrol ediyorum...`, "warning");
                }
                
                // Apply delay between checks to avoid being blocked
                await sleep(currentDelay);
            }
            
            // right is now the last valid page
            const lastValidPage = right;
            addToLog(`Son geçerli sayfa: ${lastValidPage}`, "success");
            
            // Now scrape all valid pages from 1 to lastValidPage
            for (let page = 1; page <= lastValidPage && currentlyScraping; page++) {
                validPages.push(page);
            }
        } else {
            // Sequential check - check each page one by one
            addToLog(`Sıralı kontrol ile geçerli sayfalar tespit ediliyor...`, "info");
            
            for (let page = 1; page <= maxPages && currentlyScraping; page++) {
                updateStatus(categoryName, `Sayfa ${page}/${maxPages} kontrol ediliyor`, collectedASINs.length);
                
                const pageExists = await checkPageExists(categoryUrl, page);
                
                if (pageExists) {
                    validPages.push(page);
                    addToLog(`Sayfa ${page} mevcut.`, "success");
                } else {
                    addToLog(`Sayfa ${page} mevcut değil. Kontrol sonlandırılıyor.`, "warning");
                    break;
                }
                
                // Apply delay between checks to avoid being blocked
                await sleep(currentDelay);
            }
        }
        
        // Now we have all valid pages, let's extract ASINs
        if (validPages.length > 0) {
            addToLog(`Toplam ${validPages.length} geçerli sayfa bulundu. ASIN tarama başlıyor...`, "success");
            await scrapeValidPages(categoryUrl, categoryName, validPages);
        } else {
            addToLog(`"${categoryName}" kategorisinde geçerli sayfa bulunamadı.`, "error");
        }
    }

    async function checkPageExists(url, pageNum) {
        try {
            // Create the page URL
            const pageUrl = createPageUrl(url, pageNum);
            
            // Use fetch with HEAD method to efficiently check if page exists
            const frameId = `check_frame_${Date.now()}`;
            const result = await new Promise((resolve) => {
                // Create an invisible iframe to load the page
                const iframe = document.createElement('iframe');
                iframe.id = frameId;
                iframe.style.display = 'none';
                document.body.appendChild(iframe);
                
                // Set a timeout for the check
                const timeout = setTimeout(() => {
                    document.body.removeChild(iframe);
                    resolve(false);
                }, 15000);
                
                // Listen for iframe load event
                iframe.onload = () => {
                    clearTimeout(timeout);
                    try {
                        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                        
                        // Check if we got blocked by a CAPTCHA
                        if (iframeDoc.body.textContent.includes("captcha") || 
                            iframeDoc.body.textContent.includes("Captcha") ||
                            iframeDoc.body.textContent.includes("robot") || 
                            iframeDoc.body.textContent.includes("Robot")) {
                            addToLog("CAPTCHA algılandı! Daha uzun gecikme ekleniyor...", "error");
                            currentDelay = currentDelay * 2; // Increase delay when CAPTCHA is detected
                            resolve(false);
                            return;
                        }
                        
                        // Check for the presence of products
                        const hasProducts = iframeDoc.querySelectorAll("[data-asin]").length > 0 || 
                                          iframeDoc.querySelectorAll(".s-result-item").length > 0;
                                          
                        document.body.removeChild(iframe);
                        resolve(hasProducts);
                    } catch (e) {
                        document.body.removeChild(iframe);
                        resolve(false);
                    }
                };
                
                // Set iframe source to load the page
                iframe.src = pageUrl;
            });
            
            // Store result in cache to avoid unnecessary checks
            pageCheckStatus[pageNum] = result;
            return result;
        } catch (e) {
            console.error(`Error checking page ${pageNum}:`, e);
            return false;
        }
    }

    async function scrapeValidPages(categoryUrl, categoryName, validPages) {
        const initialDelay = parseInt(document.getElementById("initialDelay").value) || 2000;
        const progressiveDelayPercent = parseInt(document.getElementById("progressiveDelay").value) || 15;
        let totalProducts = 0;
        
        for (let i = 0; i < validPages.length && currentlyScraping; i++) {
            const page = validPages[i];
            
            // Update status
            updateStatus(categoryName, `Sayfa ${page}/${validPages.length} taranıyor`, totalProducts);
            
            // Calculate progressive delay
            const pageDelay = calculateDelay(initialDelay, progressiveDelayPercent, i+1);
            
            try {
                // Navigate to the page
                await navigateToPage(categoryUrl, page);
                
                // Extract ASINs
                const asins = await extractASINsFromCurrentPage();
                
                if (asins.length > 0) {
                    // Store ASINs with their category
                    asins.forEach(asin => {
                        collectedASINs.push({
                            asin: asin,
                            category: categoryName
                        });
                    });
                    
                    totalProducts += asins.length;
                    addToLog(`Sayfa ${page}: ${asins.length} ASIN bulundu (Toplam: ${totalProducts})`, "success");
                } else {
                    addToLog(`Sayfa ${page}: ASIN bulunamadı.`, "warning");
                }
                
                // Wait before processing next page
                await sleep(pageDelay);
            } catch (error) {
                addToLog(`Sayfa ${page}: Hata - ${error.message}`, "error");
                await sleep(pageDelay * 2);
            }
        }
        
        addToLog(`"${categoryName}" kategorisi taraması tamamlandı. Toplam ${totalProducts} ASIN toplandı.`, "success");
        return totalProducts;
    }

    function createPageUrl(baseUrl, page) {
        // Parse the URL
        const url = new URL(baseUrl);
        const params = new URLSearchParams(url.search);
        
        // Add or update the page parameter
        params.set('page', page.toString());
        
        // Update URL search parameters
        url.search = params.toString();
        
        return url.toString();
    }

    async function navigateToPage(baseUrl, page) {
        return new Promise((resolve, reject) => {
            try {
                const pageUrl = createPageUrl(baseUrl, page);
                
                // Create a temporary anchor element to navigate
                const link = document.createElement('a');
                link.href = pageUrl;
                link.target = "_self"; // Navigate in the same window
                
                // Simulate click to navigate
                link.click();
                
                // Wait for page to load
                setTimeout(() => {
                    resolve(true);
                }, 3000); // Giving time for the page to load
            } catch (e) {
                reject(e);
            }
        });
    }

    async function extractASINsFromCurrentPage() {
        // This function extracts ASINs from the current page without using XHR
        return new Promise((resolve) => {
            setTimeout(() => {
                try {
                    // Try different selectors for ASIN extraction
                    let asinElements = document.querySelectorAll("[data-asin]");
                    
                    if (asinElements.length === 0) {
                        asinElements = document.querySelectorAll(".s-result-item");
                    }
                    
                    if (asinElements.length === 0) {
                        asinElements = document.querySelectorAll("[data-component-id]");
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
                    
                    resolve(asins);
                } catch (e) {
                    console.error("Error extracting ASINs:", e);
                    resolve([]);
                }
            }, 1000); // Small delay to ensure page is fully loaded
        });
    }

    function calculateDelay(initialDelay, progressivePercent, pageNumber) {
        // Calculate progressive delay that increases with page number
        const multiplier = 1 + (Math.min(pageNumber, 100) - 1) * (progressivePercent / 100);
        return Math.round(initialDelay * multiplier);
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
