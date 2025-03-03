(function () {
    'use strict';

    let active = false;
    let collectedASINs = [];
    let categoryQueue = [];
    let isProcessing = false;
    let currentCategory = '';
    let currentPage = 0;
    let totalProducts = 0;

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
        button.style.borderRadius = "5px";
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
                if (isProcessing) {
                    isProcessing = false;
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
        panel.style.borderRadius = "8px";
        panel.style.zIndex = "10000";
        panel.style.padding = "15px";
        panel.style.overflow = "hidden";
        panel.style.boxShadow = "0 4px 8px rgba(0,0,0,0.2)";
        document.body.appendChild(panel);

        panel.innerHTML = `
            <h3 style="text-align:center; margin-top: 5px; color: #333;">ASIN Tarayıcı</h3>
            <div style="display:flex; height: 90%;">
                <div id="categoryList" style="width: 50%; overflow-y: auto; border-right: 1px solid #ccc; padding: 10px;"></div>
                <div style="width: 50%; display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 10px;">
                    <button id="selectAll" style="margin-bottom: 15px; padding: 8px 15px; background-color: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">Hepsini Seç</button>
                    <button id="clearSelection" style="margin-bottom: 15px; padding: 8px 15px; background-color: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer;">Seçimi Temizle</button>
                    <div style="margin-bottom: 15px; text-align: center;">
                        <label for="maxPageInput" style="display: block; margin-bottom: 5px;">Maksimum Sayfa Sayısı:</label>
                        <input type="number" id="maxPageInput" min="1" max="400" value="400" style="padding: 5px; width: 80px; text-align: center;">
                    </div>
                    <button id="startScraping" style="padding: 12px 25px; font-size: 16px; background-color: #2196F3; color: white; border: none; border-radius: 4px; cursor: pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">Tarama Başlat</button>
                    <div style="margin-top: 15px; text-align: center;">
                        <button id="scanSeller" style="padding: 10px 20px; background-color: #673AB7; color: white; border: none; border-radius: 4px; cursor: pointer;">Tüm Satıcı Ürünlerini Tara</button>
                    </div>
                </div>
            </div>
        `;
        loadCategories();
        document.getElementById("startScraping").addEventListener("click", startScraping);
        document.getElementById("scanSeller").addEventListener("click", scanAllSellerProducts);
        document.getElementById("selectAll").addEventListener("click", () => {
            document.querySelectorAll("#categoryList input").forEach(cb => cb.checked = true);
        });
        document.getElementById("clearSelection").addEventListener("click", () => {
            document.querySelectorAll("#categoryList input").forEach(cb => cb.checked = false);
        });
    }

    function loadCategories() {
        const categoryContainer = document.getElementById("categoryList");
        categoryContainer.innerHTML = "<b style='color: #333; display: block; margin-bottom: 10px;'>Mağaza Kategorileri:</b>";

        // Get the seller ID from the current URL
        const url = window.location.href;
        let sellerID = '';
        let marketplaceID = '';
        
        // Extract seller ID from me= or rh= parameter
        const meMatch = url.match(/me=([A-Z0-9]+)/);
        const rhMatch = url.match(/p_6%3A([A-Z0-9]+)/);
        
        if (meMatch && meMatch[1]) {
            sellerID = meMatch[1];
        } else if (rhMatch && rhMatch[1]) {
            sellerID = rhMatch[1];
        }
        
        // Extract marketplace ID
        const marketplaceMatch = url.match(/marketplaceID=([A-Z0-9]+)/);
        if (marketplaceMatch && marketplaceMatch[1]) {
            marketplaceID = marketplaceMatch[1];
        }

        if (!sellerID || !marketplaceID) {
            categoryContainer.innerHTML = "<p style='color: red;'>Satıcı veya marketplace ID bulunamadı!</p>";
            return;
        }

        // Skip list for filtering out non-product categories
        const skipCategories = [
            "4 Stars & Up",
            "New",
            "All Discounts",
            "Climate Pledge Friendly",
            "Amazon Global Store",
            "Subscribe & Save",
            "Include Out of Stock",
            "Free Shipping",
            "Today's Deals",
            "International Shipping",
            "Featured Brands",
            "Avg. Customer Review",
            "Eligible for Free Shipping",
            "From Our Brands",
            "Sponsored"
        ];

        // Get categories from the navigation menu
        document.querySelectorAll(".s-navigation-item").forEach(item => {
            const categoryName = item.innerText.trim();
            const categoryHref = item.href;
            
            // Skip non-product categories
            if (skipCategories.some(skipCategory => categoryName.includes(skipCategory))) {
                return;
            }
            
            // Check if it's a valid category link 
            if (categoryName && categoryHref) {
                let categoryUrl;
                
                if (categoryHref.includes('n%3A')) {
                    // For category-specific links, preserve the category ID
                    const categoryMatch = categoryHref.match(/n%3A([0-9]+)/);
                    if (categoryMatch && categoryMatch[1]) {
                        const categoryId = categoryMatch[1];
                        categoryUrl = `${window.location.origin}${window.location.pathname}?rh=n%3A${categoryId}%2Cp_6%3A${sellerID}&marketplaceID=${marketplaceID}`;
                    } else {
                        categoryUrl = `${window.location.origin}${window.location.pathname}?rh=p_6%3A${sellerID}&marketplaceID=${marketplaceID}`;
                    }
                } else {
                    categoryUrl = `${window.location.origin}${window.location.pathname}?rh=p_6%3A${sellerID}&marketplaceID=${marketplaceID}`;
                }
                
                const checkbox = document.createElement("input");
                checkbox.type = "checkbox";
                checkbox.value = categoryUrl;
                checkbox.dataset.name = categoryName;
                checkbox.style.marginRight = "5px";
                
                const label = document.createElement("label");
                label.textContent = categoryName;
                label.style.color = "#333";
                label.style.fontSize = "14px";
                
                const container = document.createElement("div");
                container.style.marginBottom = "8px";
                container.style.display = "flex";
                container.style.alignItems = "center";
                
                container.appendChild(checkbox);
                container.appendChild(label);
                categoryContainer.appendChild(container);
            }
        });

        // Add option for all products
        const allProductsCheck = document.createElement("input");
        allProductsCheck.type = "checkbox";
        allProductsCheck.value = `${window.location.origin}${window.location.pathname}?rh=p_6%3A${sellerID}&marketplaceID=${marketplaceID}`;
        allProductsCheck.dataset.name = "Tüm Ürünler";
        allProductsCheck.style.marginRight = "5px";
        
        const allProductsLabel = document.createElement("label");
        allProductsLabel.textContent = "Tüm Ürünler";
        allProductsLabel.style.color = "#333";
        allProductsLabel.style.fontSize = "14px";
        allProductsLabel.style.fontWeight = "bold";
        
        const allProductsContainer = document.createElement("div");
        allProductsContainer.style.marginBottom = "8px";
        allProductsContainer.style.display = "flex";
        allProductsContainer.style.alignItems = "center";
        allProductsContainer.style.padding = "5px";
        allProductsContainer.style.backgroundColor = "#f5f5f5";
        allProductsContainer.style.borderRadius = "4px";
        
        allProductsContainer.appendChild(allProductsCheck);
        allProductsContainer.appendChild(allProductsLabel);
        categoryContainer.insertBefore(allProductsContainer, categoryContainer.firstChild.nextSibling);
    }
    
    function scanAllSellerProducts() {
        if (isProcessing) {
            alert("Tarama zaten devam ediyor!");
            return;
        }

        const url = window.location.href;
        let sellerID = '';
        let marketplaceID = '';
        
        // Extract seller ID from me= or rh= parameter
        const meMatch = url.match(/me=([A-Z0-9]+)/);
        const rhMatch = url.match(/p_6%3A([A-Z0-9]+)/);
        
        if (meMatch && meMatch[1]) {
            sellerID = meMatch[1];
        } else if (rhMatch && rhMatch[1]) {
            sellerID = rhMatch[1];
        }
        
        // Extract marketplace ID
        const marketplaceMatch = url.match(/marketplaceID=([A-Z0-9]+)/);
        if (marketplaceMatch && marketplaceMatch[1]) {
            marketplaceID = marketplaceMatch[1];
        }

        if (!sellerID || !marketplaceID) {
            alert("Satıcı veya marketplace ID bulunamadı!");
            return;
        }

        collectedASINs = [];
        categoryQueue = [];
        totalProducts = 0;
        
        // Create properly formatted URL for all seller products
        const sellerUrl = `${window.location.origin}${window.location.pathname}?rh=p_6%3A${sellerID}&marketplaceID=${marketplaceID}`;
        categoryQueue.push({ url: sellerUrl, name: "Tüm Satıcı Ürünleri" });

        createProgressBox();
        isProcessing = true;
        processCategories();
    }

    function startScraping() {
        if (isProcessing) {
            alert("Tarama zaten devam ediyor!");
            return;
        }

        collectedASINs = [];
        categoryQueue = [];
        totalProducts = 0;
        
        document.querySelectorAll("#categoryList input:checked").forEach(checkbox => {
            categoryQueue.push({ url: checkbox.value, name: checkbox.dataset.name });
        });

        if (categoryQueue.length === 0) {
            alert("Lütfen en az bir kategori seçin!");
            return;
        }

        createProgressBox();
        isProcessing = true;
        processCategories();
    }

    function createProgressBox() {
        const existingBox = document.getElementById("progressBox");
        if (existingBox) existingBox.remove();

        const progressBox = document.createElement("div");
        progressBox.id = "progressBox";
        progressBox.style.position = "fixed";
        progressBox.style.top = "50%";
        progressBox.style.left = "50%";
        progressBox.style.transform = "translate(-50%, -50%)";
        progressBox.style.backgroundColor = "#333";
        progressBox.style.color = "white";
        progressBox.style.padding = "15px";
        progressBox.style.borderRadius = "8px";
        progressBox.style.zIndex = "9999";
        progressBox.style.minWidth = "250px";
        progressBox.style.boxShadow = "0 4px 8px rgba(0,0,0,0.3)";
        progressBox.style.fontFamily = "Arial, sans-serif";
        progressBox.style.textAlign = "center";
        
        progressBox.innerHTML = `
            <div style="margin-bottom: 10px; font-weight: bold; font-size: 16px; border-bottom: 1px solid #555; padding-bottom: 5px;">
                ASIN Tarama İlerlemesi
            </div>
            <div id="currentCategory" style="margin-bottom: 5px;">Kategori: <span style="font-weight: bold;">-</span></div>
            <div id="currentPage" style="margin-bottom: 5px;">Sayfa: <span>0</span> / <span>0</span></div>
            <div id="productCount" style="margin-bottom: 5px;">Ürün Sayısı: <span>0</span></div>
            <div id="totalProductCount" style="margin-bottom: 10px;">Toplam Ürün: <span>0</span></div>
            <div style="width: 100%; background-color: #555; height: 10px; border-radius: 5px; overflow: hidden;">
                <div id="progressBar" style="width: 0%; height: 100%; background-color: #4CAF50;"></div>
            </div>
            <div style="display: flex; justify-content: space-between; margin-top: 10px;">
                <button id="pauseButton" style="padding: 5px 10px; background-color: #FFC107; border: none; border-radius: 4px; cursor: pointer;">Duraklat</button>
                <button id="cancelButton" style="padding: 5px 10px; background-color: #f44336; border: none; border-radius: 4px; cursor: pointer;">İptal</button>
                <button id="downloadButton" style="padding: 5px 10px; background-color: #2196F3; border: none; border-radius: 4px; cursor: pointer;">İndİr</button>
            </div>
        `;
        
        document.body.appendChild(progressBox);
        
        document.getElementById("pauseButton").addEventListener("click", togglePause);
        document.getElementById("cancelButton").addEventListener("click", cancelScraping);
        document.getElementById("downloadButton").addEventListener("click", generateExcel);
    }

    let isPaused = false;
    
    function togglePause() {
        isPaused = !isPaused;
        const pauseButton = document.getElementById("pauseButton");
        if (pauseButton) {
            pauseButton.textContent = isPaused ? "Devam Et" : "Duraklat";
            pauseButton.style.backgroundColor = isPaused ? "#2196F3" : "#FFC107";
        }
    }
    
    function cancelScraping() {
        isProcessing = false;
        categoryQueue = [];
        document.getElementById("progressBox")?.remove();
    }

    async function processCategories() {
        if (!isProcessing) return;
        
        if (categoryQueue.length === 0) {
            generateExcel();
            isProcessing = false;
            updateProgressUI('', 0, 0, 0, 0);
            return;
        }
        
        const { url, name } = categoryQueue[0];
        currentCategory = name;
        await scrapeCategory(url, name);
        
        categoryQueue.shift();
        processCategories(); // Removed timeout for faster processing
    }

    async function scrapeCategory(url, category) {
        let categoryProducts = 0;
        currentPage = 1;
        let userMaxPage = parseInt(document.getElementById("maxPageInput")?.value || 400);
        let maxPage = Math.min(isNaN(userMaxPage) ? 400 : userMaxPage, 400);
        let hasMorePages = true;
        
        // First, check how many pages are available
        const firstPageUrl = ensureCorrectPageUrl(url, 1);
        updateProgressUI(category, currentPage, maxPage, categoryProducts, totalProducts);
        
        const firstPageInfo = await fetchPageInfo(firstPageUrl);
        if (firstPageInfo && firstPageInfo.maxPage) {
            maxPage = Math.min(firstPageInfo.maxPage, maxPage);
            updateProgressUI(category, currentPage, maxPage, categoryProducts, totalProducts);
        }

        // Create a queue of page numbers to process
        let pageQueue = Array.from({length: maxPage}, (_, i) => i + 1);
        
        // Process all pages in parallel (with a reasonable limit)
        const concurrencyLimit = 5; // Process 5 pages at once
        while (pageQueue.length > 0 && isProcessing) {
            // Check if paused
            if (isPaused) {
                await new Promise(resolve => setTimeout(resolve, 100));
                continue;
            }
            
            // Take the next batch of pages to process
            const batch = pageQueue.splice(0, concurrencyLimit);
            
            // Process this batch in parallel
            const results = await Promise.all(batch.map(pageNum => {
                const pageUrl = ensureCorrectPageUrl(url, pageNum);
                return fetchASINs(pageUrl).then(result => {
                    currentPage = Math.max(currentPage, pageNum);
                    updateProgressUI(category, currentPage, maxPage, categoryProducts, totalProducts);
                    return result;
                });
            }));
            
            // Process results from this batch
            for (const { asins } of results) {
                if (asins && asins.length > 0) {
                    // Filter out duplicates
                    const newAsins = asins.filter(asin => !collectedASINs.includes(asin));
                    collectedASINs.push(...newAsins);
                    categoryProducts += newAsins.length;
                    totalProducts += newAsins.length;
                }
            }
            
            updateProgressUI(category, currentPage, maxPage, categoryProducts, totalProducts);
        }
    }

    // Helper function to ensure the URL has the correct page parameter
    function ensureCorrectPageUrl(url, page) {
        // First, remove any existing page parameter
        let cleanUrl = url.replace(/&page=\d+/, '');
        
        // Add the page parameter
        if (cleanUrl.includes('?')) {
            return `${cleanUrl}&page=${page}`;
        } else {
            return `${cleanUrl}?page=${page}`;
        }
    }

    function updateProgressUI(category, page, maxPage, categoryProducts, totalProducts) {
        const progressBox = document.getElementById("progressBox");
        if (!progressBox) return;
        
        document.getElementById("currentCategory").innerHTML = `Kategori: <span style="font-weight: bold;">${category || '-'}</span>`;
        document.getElementById("currentPage").innerHTML = `Sayfa: <span>${page}</span> / <span>${maxPage}</span>`;
        document.getElementById("productCount").innerHTML = `Ürün Sayısı: <span>${categoryProducts}</span>`;
        document.getElementById("totalProductCount").innerHTML = `Toplam Ürün: <span>${totalProducts}</span>`;
        
        // Update progress bar
        const progress = Math.min(100, Math.round((page / maxPage) * 100));
        document.getElementById("progressBar").style.width = `${progress}%`;
    }

    async function fetchPageInfo(url) {
        try {
            const response = await fetch(url);
            const text = await response.text();
            const doc = new DOMParser().parseFromString(text, "text/html");
            
            // Try to find pagination info
            const paginationElements = doc.querySelectorAll(".s-pagination-item");
            let maxPage = 1;
            
            paginationElements.forEach(el => {
                if (!isNaN(parseInt(el.textContent.trim()))) {
                    const pageNum = parseInt(el.textContent.trim());
                    if (pageNum > maxPage) maxPage = pageNum;
                }
            });
            
            return { maxPage };
        } catch (error) {
            console.error(`Pagination fetch error: ${error}`);
            return { maxPage: 1 };
        }
    }

    async function fetchASINs(url) {
        try {
            const response = await fetch(url);
            const text = await response.text();
            const doc = new DOMParser().parseFromString(text, "text/html");
            
            const asins = [...doc.querySelectorAll("div[data-asin]")]
                .map(el => el.getAttribute("data-asin"))
                .filter(asin => asin && asin.trim() !== '');
            
            // Check if there's a next page
            const hasNext = !!doc.querySelector(".s-pagination-next:not(.s-pagination-disabled)");
            
            return { asins, hasNext };
        } catch (error) {
            console.error(`ASIN fetch error: ${error}`);
            return { asins: [], hasNext: false };
        }
    }

    function generateExcel() {
        // Generate a timestamp for the filename
        const now = new Date();
        const timestamp = `${now.getFullYear()}-${(now.getMonth()+1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}_${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}`;
        
        // Deduplicate ASINs before exporting
        const uniqueASINs = [...new Set(collectedASINs)];
        
        // Create a header row
        const header = "ASIN";
        
        // Combine the header and data
        const content = [header, ...uniqueASINs].join("\n");
        
        // Create and download the file
        const blob = new Blob([content], { type: "text/csv" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `asins_${timestamp}.csv`;
        link.click();
        
        // Show completion notification
        showNotification(`Tarama tamamlandı! ${uniqueASINs.length} benzersiz ürün toplandı.`);
    }
    
    function showNotification(message) {
        const notification = document.createElement("div");
        notification.style.position = "fixed";
        notification.style.top = "20px";
        notification.style.left = "50%";
        notification.style.transform = "translateX(-50%)";
        notification.style.backgroundColor = "#4CAF50";
        notification.style.color = "white";
        notification.style.padding = "15px 20px";
        notification.style.borderRadius = "5px";
        notification.style.zIndex = "10001";
        notification.style.boxShadow = "0 4px 8px rgba(0,0,0,0.2)";
        notification.style.fontFamily = "Arial, sans-serif";
        notification.style.fontWeight = "bold";
        notification.innerText = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.opacity = "0";
            notification.style.transition = "opacity 0.5s ease";
            setTimeout(() => notification.remove(), 500);
        }, 3000);
    }

    createToggleButton();
})();
