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
                    <div style="margin-bottom: 20px;">
                        <label for="useParallelScraping">Paralel Tarama:</label>
                        <input type="checkbox" id="useParallelScraping" checked>
                        <span style="font-size: 12px; display: block; margin-top: 5px; color: #666;">Sayfaları daha hızlı taramak için paralel istek yapar</span>
                    </div>
                    <div style="margin-bottom: 20px;">
                        <label for="useOptimizedURLs">Optimized URLs Kullan:</label>
                        <input type="checkbox" id="useOptimizedURLs" checked>
                        <span style="font-size: 12px; display: block; margin-top: 5px; color: #666;">URL tipinden bağımsız tarama yapar</span>
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
        
        // Mevcut URL'den satıcı ID'sini al
        const currentUrl = window.location.href;
        const sellerIdMatch = currentUrl.match(/me=([A-Z0-9]+)/) || currentUrl.match(/p_6%3A([A-Z0-9]+)/);
        const marketplaceIdMatch = currentUrl.match(/marketplaceID=([A-Z0-9]+)/);
        
        const sellerId = sellerIdMatch ? sellerIdMatch[1] : getSellerIdFromPage();
        const marketplaceId = marketplaceIdMatch ? marketplaceIdMatch[1] : getMarketplaceIdFromPage();
        
        if (sellerId) {
            // Ana kategori - Tüm ürünler (her iki URL formatında da)
            const allProductsCheckbox1 = document.createElement("input");
            allProductsCheckbox1.type = "checkbox";
            allProductsCheckbox1.value = `https://www.amazon.co.uk/s?rh=p_6%3A${sellerId}&marketplaceID=${marketplaceId}`;
            allProductsCheckbox1.dataset.name = "Tüm Ürünler (rh=p_6)";
            allProductsCheckbox1.dataset.sellerId = sellerId;
            allProductsCheckbox1.dataset.marketplaceId = marketplaceId;
            allProductsCheckbox1.dataset.urlType = "rh";
            allProductsCheckbox1.style.marginRight = "5px";
            allProductsCheckbox1.checked = true; // Varsayılan olarak seçili
            
            const allProductsLabel1 = document.createElement("label");
            allProductsLabel1.textContent = "Tüm Ürünler (rh=p_6)";
            allProductsLabel1.style.fontWeight = "bold";
            
            categoryContainer.appendChild(allProductsCheckbox1);
            categoryContainer.appendChild(allProductsLabel1);
            categoryContainer.appendChild(document.createElement("br"));
            
            // İkinci format (me= formatı)
            const allProductsCheckbox2 = document.createElement("input");
            allProductsCheckbox2.type = "checkbox";
            allProductsCheckbox2.value = `https://www.amazon.co.uk/s?me=${sellerId}&marketplaceID=${marketplaceId}`;
            allProductsCheckbox2.dataset.name = "Tüm Ürünler (me=)";
            allProductsCheckbox2.dataset.sellerId = sellerId;
            allProductsCheckbox2.dataset.marketplaceId = marketplaceId;
            allProductsCheckbox2.dataset.urlType = "me";
            allProductsCheckbox2.style.marginRight = "5px";
            
            const allProductsLabel2 = document.createElement("label");
            allProductsLabel2.textContent = "Tüm Ürünler (me=)";
            allProductsLabel2.style.fontWeight = "bold";
            
            categoryContainer.appendChild(allProductsCheckbox2);
            categoryContainer.appendChild(allProductsLabel2);
            categoryContainer.appendChild(document.createElement("br"));
            categoryContainer.appendChild(document.createElement("hr"));
        }

        // Sayfadaki kategori linklerini al
        document.querySelectorAll(".s-navigation-item").forEach(item => {
            const categoryName = item.innerText.trim();
            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            
            // URL'yi özel formata dönüştür
            let categoryUrl = item.href;
            if (sellerId) {
                // Kategori parametrelerini al
                const categoryParams = getCategoryParamsFromUrl(categoryUrl);
                // Yeni URL formatını oluştur
                if (categoryParams) {
                    categoryUrl = `https://www.amazon.co.uk/s?rh=${categoryParams},p_6%3A${sellerId}&marketplaceID=${marketplaceId}`;
                }
            }
            
            checkbox.value = categoryUrl;
            checkbox.dataset.name = categoryName;
            checkbox.dataset.sellerId = sellerId;
            checkbox.dataset.marketplaceId = marketplaceId;
            checkbox.style.marginRight = "5px";
            const label = document.createElement("label");
            label.textContent = categoryName;
            categoryContainer.appendChild(checkbox);
            categoryContainer.appendChild(label);
            categoryContainer.appendChild(document.createElement("br"));
        });
    }

    function getSellerIdFromPage() {
        // Sayfadaki meta bilgilerden veya diğer elementlerden satıcı ID'sini almaya çalış
        const metaTags = document.querySelectorAll('meta');
        for (let i = 0; i < metaTags.length; i++) {
            const content = metaTags[i].getAttribute('content') || '';
            if (content.includes('merchant=')) {
                const match = content.match(/merchant=([A-Z0-9]+)/);
                if (match) return match[1];
            }
        }
        
        // DOM'da satıcı ID'sini bulmak için farklı yöntemler dene
        // me= formatındaki bağlantılar
        const sellerElements = document.querySelectorAll('a[href*="/s?me="]');
        if (sellerElements.length > 0) {
            const href = sellerElements[0].getAttribute('href');
            const match = href.match(/me=([A-Z0-9]+)/);
            if (match) return match[1];
        }
        
        // p_6= formatındaki bağlantılar
        const sellerElementsP6 = document.querySelectorAll('a[href*="p_6%3A"]');
        if (sellerElementsP6.length > 0) {
            const href = sellerElementsP6[0].getAttribute('href');
            const match = href.match(/p_6%3A([A-Z0-9]+)/);
            if (match) return match[1];
        }
        
        // URL'den direkt almayı dene
        const currentUrl = window.location.href;
        const sellerMatch = currentUrl.match(/me=([A-Z0-9]+)/) || currentUrl.match(/p_6%3A([A-Z0-9]+)/);
        return sellerMatch ? sellerMatch[1] : null;
    }

    function getMarketplaceIdFromPage() {
        // Sayfadan marketplace ID'sini al
        const currentUrl = window.location.href;
        const match = currentUrl.match(/marketplaceID=([A-Z0-9]+)/);
        return match ? match[1] : 'A1F83G8C2ARO7P'; // Varsayılan olarak UK marketplace ID'si
    }

    function getCategoryParamsFromUrl(url) {
        // URL'den kategori parametrelerini çıkar
        const match = url.match(/\/s\?.*?(?:rh=|k=|i=)([^&]+)/);
        return match ? match[1] : null;
    }

    function startScraping() {
        if (currentlyScraping) return;
        
        collectedASINs = [];
        categoryQueue = [];
        document.querySelectorAll("#categoryList input:checked").forEach(checkbox => {
            categoryQueue.push({ 
                url: checkbox.value, 
                name: checkbox.dataset.name,
                sellerId: checkbox.dataset.sellerId,
                marketplaceId: checkbox.dataset.marketplaceId,
                urlType: checkbox.dataset.urlType
            });
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
            let category = categoryQueue.shift();
            await scrapeCategory(category, maxPages);
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

    async function scrapeCategory(category, maxPages) {
        let totalProducts = 0;
        const baseDelay = parseInt(document.getElementById("delayBetweenRequests").value) || 1000;
        const useDynamicDelay = document.getElementById("useDynamicDelay").checked;
        const useRotatingHeaders = document.getElementById("useRotatingHeaders").checked;
        const useParallelScraping = document.getElementById("useParallelScraping").checked;
        const useOptimizedURLs = document.getElementById("useOptimizedURLs").checked;
        let progressLog = [];
        
        progressLog.push(`Kategori taraması başlatılıyor: ${category.name}`);
        updateProgress(category.name, totalProducts, 0, false, progressLog);
        
        // Her iki URL tipini de deneme (optimize edilmiş yöntem)
        if (useOptimizedURLs && category.sellerId && category.marketplaceId) {
            // Hem p_6 hem de me= formatlarını oluştur
            const rhUrl = `https://www.amazon.co.uk/s?rh=p_6%3A${category.sellerId}&marketplaceID=${category.marketplaceId}`;
            const meUrl = `https://www.amazon.co.uk/s?me=${category.sellerId}&marketplaceID=${category.marketplaceId}`;
            
            if (useParallelScraping) {
                await scrapeParallel(rhUrl, meUrl, category.name, maxPages, baseDelay, useDynamicDelay, useRotatingHeaders, progressLog);
            } else {
                // Önce rh formatı ile dene
                const rhSuccess = await scrapeWithFormat(rhUrl, category.name, maxPages, baseDelay, useDynamicDelay, useRotatingHeaders, progressLog);
                
                // İlk format başarısız olursa, ikinci formatı dene
                if (!rhSuccess && currentlyScraping) {
                    progressLog.push(`rh format başarısız oldu, me= formatı deneniyor...`);
                    updateProgress(category.name, totalProducts, 0, false, progressLog);
                    await scrapeWithFormat(meUrl, category.name, maxPages, baseDelay, useDynamicDelay, useRotatingHeaders, progressLog);
                }
            }
        } else {
            // Orijinal URL ile devam et
            await scrapeWithFormat(category.url, category.name, maxPages, baseDelay, useDynamicDelay, useRotatingHeaders, progressLog);
        }
        
        // Tarama tamamlandı
        progressLog.push(`Kategori taraması tamamlandı!`);
        updateProgress(category.name, collectedASINs.length, maxPages, true, progressLog);
    }

    async function scrapeParallel(url1, url2, categoryName, maxPages, baseDelay, useDynamicDelay, useRotatingHeaders, progressLog) {
        // Paralel tarama için sayfa dağılımını planla
        const pageChunks = [];
        let currentChunk = [];
        
        for (let page = 1; page <= maxPages; page++) {
            currentChunk.push(page);
            if (currentChunk.length >= 20 || page === maxPages) {
                pageChunks.push([...currentChunk]);
                currentChunk = [];
            }
        }
        
        progressLog.push(`Paralel tarama başlatıldı - Toplam ${pageChunks.length} grup`);
        updateProgress(categoryName, 0, 0, false, progressLog);
        
        let totalProcessed = 0;
        
        // Her sayfa grubunu paralel olarak tara
        for (let i = 0; i < pageChunks.length && currentlyScraping; i++) {
            const chunk = pageChunks[i];
            progressLog.push(`Grup ${i+1}/${pageChunks.length} taranıyor (Sayfa ${chunk[0]}-${chunk[chunk.length-1]})`);
            updateProgress(categoryName, collectedASINs.length, totalProcessed, false, progressLog);
            
            // Her gruptaki sayfaları paralel olarak işle
            const promises = chunk.map(page => {
                // URL1 ve URL2 arasında dönüşümlü olarak seç
                const baseUrl = page % 2 === 0 ? url1 : url2;
                return fetchPageASINs(baseUrl, page, useRotatingHeaders);
            });
            
            try {
                const results = await Promise.all(promises);
                
                // Sonuçları işle
                let newAsins = 0;
                results.forEach((result, idx) => {
                    if (result && result.asins && result.asins.length > 0) {
                        const uniqueAsins = result.asins.filter(asin => asin && asin.trim() !== '' && asin.length >= 10);
                        const page = chunk[idx];
                        
                        // Her ASIN'i kategori bilgisiyle birlikte saklayalım
                        uniqueAsins.forEach(asin => {
                            // Sadece benzersiz ASIN'leri ekle
                            if (!collectedASINs.some(item => item.asin === asin)) {
                                collectedASINs.push({
                                    asin: asin,
                                    category: categoryName,
                                    page: page
                                });
                                newAsins++;
                            }
                        });
                    }
                });
                
                progressLog.push(`Grup ${i+1} tamamlandı: ${newAsins} yeni ASIN bulundu`);
                updateProgress(categoryName, collectedASINs.length, totalProcessed + chunk.length, false, progressLog);
                totalProcessed += chunk.length;
                
                // Gecikme ekle
                if (i < pageChunks.length - 1 && currentlyScraping) {
                    let delay = baseDelay;
                    if (useDynamicDelay) {
                        // Rastgele gecikme ekle (0.7x - 1.5x arasında)
                        const randomFactor = 0.7 + Math.random() * 0.8; // 0.7 ile 1.5 arasında
                        delay = Math.floor(baseDelay * randomFactor);
                    }
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            } catch (error) {
                progressLog.push(`Grup ${i+1} tarama hatası: ${error.message}`);
                updateProgress(categoryName, collectedASINs.length, totalProcessed, false, progressLog);
            }
        }
        
        return true;
    }
    
    async function scrapeWithFormat(baseUrl, categoryName, maxPages, baseDelay, useDynamicDelay, useRotatingHeaders, progressLog) {
        let totalProducts = 0;
        let page = 1;
        let hasMorePages = true;
        let consecutiveErrors = 0;
        let consecutiveEmptyPages = 0;
        const maxConsecutiveErrors = 3;
        const maxConsecutiveEmptyPages = 2;
        
        while (hasMorePages && page <= maxPages && currentlyScraping) {
            // URL'yi düzenle - page parametresini ekle veya güncelle
            let pageUrl = baseUrl;
            
            if (pageUrl.includes('page=')) {
                pageUrl = pageUrl.replace(/page=\d+/, `page=${page}`);
            } else if (pageUrl.includes('?')) {
                pageUrl = `${pageUrl}&page=${page}`;
            } else {
                pageUrl = `${pageUrl}?page=${page}`;
            }
            
            // İlerleme durumunu güncelle
            updateProgress(categoryName, totalProducts, page, false, progressLog);
            
            try {
                // ASIN'leri çek
                const result = await fetchPageASINs(pageUrl, page, useRotatingHeaders);
                
                if (result.success && result.asins && result.asins.length > 0) {
                    const uniqueAsins = result.asins.filter(asin => asin && asin.trim() !== '' && asin.length >= 10);
                    totalProducts += uniqueAsins.length;
                    
                    // Yeni eklenen ASIN sayısını takip et
                    let newAsinsCount = 0;
                    
                    // Her ASIN'i kategori bilgisiyle birlikte saklayalım
                    uniqueAsins.forEach(asin => {
                        // Sadece benzersiz ASIN'leri ekle
                        if (!collectedASINs.some(item => item.asin === asin)) {
                            collectedASINs.push({
                                asin: asin,
                                category: categoryName,
                                page: page
                            });
                            newAsinsCount++;
                        }
                    });
                    
                    // İlerleme güncellemesi
                    progressLog.push(`Sayfa ${page}: ${uniqueAsins.length} ASIN bulundu (Yeni: ${newAsinsCount})`);
                    updateProgress(categoryName, totalProducts, page, false, progressLog);
                    
                    // Başarılı istek olduğunda hata sayacını sıfırla
                    consecutiveErrors = 0;
                    
                    // Boş sayfa sayacını kontrol et
                    if (uniqueAsins.length === 0) {
                        consecutiveEmptyPages++;
                    } else {
                        consecutiveEmptyPages = 0;
                    }
                    
                    // Sayfa işleme kriterlerini kontrol et
                    if (consecutiveEmptyPages >= maxConsecutiveEmptyPages) {
                        progressLog.push(`${maxConsecutiveEmptyPages} ardışık boş sayfa - tarama durduruluyor`);
                        updateProgress(categoryName, totalProducts, page, false, progressLog);
                        hasMorePages = false;
                    } else {
                        page++;
                    }
                    
                    // Gecikme ekleme
                    if (page <= maxPages && hasMorePages) {
                        let delay = baseDelay;
                        if (useDynamicDelay) {
                            // Rastgele gecikme ekle (0.7x - 1.5x arasında)
                            const randomFactor = 0.7 + Math.random() * 0.8; // 0.7 ile 1.5 arasında
                            delay = Math.floor(baseDelay * randomFactor);
                        }
                        await new Promise(resolve => setTimeout(resolve, delay));
                    }
                } else {
                    consecutiveEmptyPages++;
                    progressLog.push(`Sayfa ${page}: ASIN bulunamadı veya sayfa boş`);
                    updateProgress(categoryName, totalProducts, page, false, progressLog);
                    
                    if (consecutiveEmptyPages >= maxConsecutiveEmptyPages) {
                        progressLog.push(`${maxConsecutiveEmptyPages} ardışık boş sayfa - tarama durduruluyor`);
                        hasMorePages = false;
                    } else {
                        page++;
                        // Daha kısa bir gecikme ekle ve devam et
                        await new Promise(resolve => setTimeout(resolve, baseDelay / 2));
                    }
                }
            } catch (error) {
                consecutiveErrors++;
                progressLog.push(`Sayfa ${page}: HATA - ${error.message || 'Bilinmeyen hata'}`);
                updateProgress(categoryName, totalProducts, page, false, progressLog);
                
                if (consecutiveErrors >= maxConsecutiveErrors) {
                    progressLog.push(`${maxConsecutiveErrors} ardışık hata - tarama durduruluyor`);
                    updateProgress(categoryName, totalProducts, page, false, progressLog);
                    hasMorePages = false;
                    return false; // Başarısız tarama
                } else {
                    // Hata sonrası daha uzun bir bekleme ekle ve sayfayı yeniden dene
                    const errorDelay = baseDelay * 2;
                    await new Promise(resolve => setTimeout(resolve, errorDelay));
                }
            }
        }
        
        return true; // Başarılı tarama
    }

    function updateProgress(category, totalProducts, currentPage, completed = false, progressLog = []) {
        const progressBox = document.getElementById("progressBox");
        if (progressBox) {
            let logHTML = `<b>${category}</b><br>`;
            logHTML += `Toplam: ${totalProducts} ASIN, Sayfa: ${currentPage}${completed ? ' (Tamamlandı)' : ''}`;
            
            // Son 5 log mesajını göster
            if (progressLog.length > 0) {
                logHTML += "<br>Son İşlemler:<br>";
                const recentLogs = progressLog.slice(-5);
                recentLogs.forEach(log => {
                    logHTML += `- ${log}<br>`;
                });
            }
            
            progressBox.innerHTML = logHTML;
        }
    }

    async function fetchPageASINs(url, page, useRotatingHeaders) {
        try {
            // İstek header'larını hazırla
            let headers = {
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'keep-alive'
            };
            
            // Header rotasyonu etkinse rastgele header'lar ekle
            if (useRotatingHeaders) {
                const randomUserAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
                const randomLanguage = acceptLanguages[Math.floor(Math.random() * acceptLanguages.length)];
                
                headers['User-Agent'] = randomUserAgent;
                headers['Accept-Language'] = randomLanguage;
                
                // Rastgele değişen referrer
                const referrers = [
                    'https://www.amazon.co.uk/',
                    'https://www.amazon.co.uk/s?k=products',
                    'https://www.google.com/',
                    'https://www.bing.com/'
                ];
                headers['Referer'] = referrers[Math.floor(Math.random() * referrers.length)];
            }
            
            // İsteği gönder
            const response = await fetch(url, {
                method: 'GET',
                headers: headers,
                credentials: 'include',
                mode: 'cors',
                cache: 'no-cache'
            });
            
            if (!response.ok) {
                throw new Error(`HTTP Hata: ${response.status}`);
            }
            
            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            // ASIN'leri çıkar
            const asins = [];
            
            // Arama sonucu sayfasındaki data-asin özelliği olan div'leri bul
            const asinElements = doc.querySelectorAll('div[data-asin]');
            asinElements.forEach(element => {
                const asin = element.getAttribute('data-asin');
                if (asin && asin.trim() !== '') {
                    asins.push(asin);
                }
            });
            
            // Alternatif yöntem: URL'lerden ASIN çıkarma
            const productLinks = doc.querySelectorAll('a[href*="/dp/"]');
            productLinks.forEach(link => {
                const href = link.getAttribute('href');
                const asinMatch = href.match(/\/dp\/([A-Z0-9]{10})/);
                if (asinMatch && asinMatch[1]) {
                    const asin = asinMatch[1];
                    if (!asins.includes(asin)) {
                        asins.push(asin);
                    }
                }
            });
            
            return { 
                success: true, 
                asins: asins, 
                page: page
            };
        } catch (error) {
            console.error(`Sayfa ${page} için hata:`, error);
            return { 
                success: false, 
                error: error.message, 
                page: page 
            };
        }
    }

    function generateExcel() {
        if (collectedASINs.length === 0) {
            alert("Dışa aktarılacak ASIN bulunamadı!");
            return;
        }
        
        // CSV header
        let csvContent = "ASIN,Category,Page\n";
        
        // CSV satırlarını ekle
        collectedASINs.forEach(item => {
            csvContent += `${item.asin},"${item.category.replace(/"/g, '""')}",${item.page}\n`;
        });
        
        // CSV dosyasını indir
        const encodedUri = encodeURI("data:text/csv;charset=utf-8," + csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `amazon_asins_${new Date().toISOString().replace(/[:.]/g, "_")}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Ayrıca kopyalamak için düz metin oluştur
        const plainASINs = collectedASINs.map(item => item.asin).join("\n");
        navigator.clipboard.writeText(plainASINs)
            .then(() => {
                // Başarılı kopyalama bildirimi
                alert(`${collectedASINs.length} ASIN CSV dosyası olarak indirildi ve panoya kopyalandı!`);
            })
            .catch(err => {
                // Sadece indirme bildirimi
                alert(`${collectedASINs.length} ASIN CSV dosyası olarak indirildi! (Panoya kopyalama başarısız: ${err.message})`);
            });
    }

    // Ana sayfada olup olmadığımızı kontrol et ve butonu göster
    if (window.location.href.includes('amazon.') && (window.location.href.includes('/s?') || window.location.href.includes('/s/'))) {
        // Eklentiyi başlat
        setTimeout(() => {
            createToggleButton();
        }, 1000);
    } else {
        console.log("Bu sayfa bir Amazon arama sonuç sayfası değil, eklenti aktif değil.");
    }
})();
