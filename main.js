(function () {
    'use strict';

    let active = false;
    let collectedASINs = [];
    let categoryQueue = [];

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
                createProgressBox();
            } else {
                document.getElementById("customPanel")?.remove();
                document.getElementById("progressBox")?.remove();
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
        document.body.appendChild(panel);

        panel.innerHTML = `
            <h3 style="text-align:center;">ASIN Tarayıcı</h3>
            <div id="categoryContainer" style="display: flex; flex-direction: column; height: 350px; overflow-y: auto; border: 1px solid gray; padding: 10px; margin-bottom: 10px;"></div>
            <div style="display: flex; justify-content: space-between;">
                <button id="selectAll" style="padding: 5px;">Hepsini Seç</button>
                <button id="clearSelection" style="padding: 5px;">Seçimi Temizle</button>
                <button id="startScraping" style="padding: 10px; font-size: 16px; background-color: blue; color: white; border: none; cursor: pointer;">Tarama Başlat</button>
            </div>
        `;

        loadCategories();
        document.getElementById("startScraping").addEventListener("click", startScraping);
        document.getElementById("selectAll").addEventListener("click", () => {
            document.querySelectorAll("#categoryContainer input").forEach(cb => cb.checked = true);
        });
        document.getElementById("clearSelection").addEventListener("click", () => {
            document.querySelectorAll("#categoryContainer input").forEach(cb => cb.checked = false);
        });
    }

    function createProgressBox() {
        document.getElementById("progressBox")?.remove();
        const progressBox = document.createElement("div");
        progressBox.id = "progressBox";
        progressBox.style.position = "fixed";
        progressBox.style.bottom = "10px";
        progressBox.style.left = "10px";
        progressBox.style.backgroundColor = "black";
        progressBox.style.color = "white";
        progressBox.style.padding = "10px";
        progressBox.style.border = "1px solid white";
        progressBox.style.zIndex = "9999";
        document.body.appendChild(progressBox);
    }

    function updateProgress(category, page, total) {
        const progressBox = document.getElementById("progressBox");
        if (progressBox) {
            progressBox.innerHTML = `Kategori: <b>${category}</b> <br> Sayfa: ${page} <br> Toplam ASIN: ${total}`;
        }
    }

    async function startScraping() {
        collectedASINs = [];
        categoryQueue = [];
        document.querySelectorAll("#categoryContainer input:checked").forEach(checkbox => {
            categoryQueue.push({ url: checkbox.value, name: checkbox.dataset.name });
        });

        if (categoryQueue.length === 0) {
            alert("Lütfen en az bir kategori seçin!");
            return;
        }

        while (categoryQueue.length > 0) {
            let { url, name } = categoryQueue.shift();
            await scrapeCategory(url, name);
        }
        downloadExcel();
    }

    async function scrapeCategory(url, category) {
        let page = 1;
        let hasMorePages = true;
        while (hasMorePages && page <= 10) {
            const pageUrl = `${url}&page=${page}`;
            const asins = await fetchASINs(pageUrl);
            collectedASINs.push(...asins);
            updateProgress(category, page, collectedASINs.length);
            if (asins.length === 0) hasMorePages = false;
            page++;
        }
    }

    async function fetchASINs(url) {
        try {
            const response = await fetch(url);
            const text = await response.text();
            const doc = new DOMParser().parseFromString(text, "text/html");
            return [...doc.querySelectorAll("div[data-asin]")].map(el => el.getAttribute("data-asin")).filter(Boolean);
        } catch (error) {
            console.error(`Hata: ${error}`);
            return [];
        }
    }

    function downloadExcel() {
        const blob = new Blob([collectedASINs.join("\n")], { type: "text/csv" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "asins.csv";
        link.click();
    }

    createToggleButton();
})();
