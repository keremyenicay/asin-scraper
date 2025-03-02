(function () {
    'use strict';

    window.onload = function () {
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

        function loadCategories() {
            const categoryContainer = document.getElementById("categoryList");
            categoryContainer.innerHTML = "<b>Mağaza Kategorileri:</b><br>";

            document.querySelectorAll(".s-navigation-item").forEach(item => {
                const checkbox = document.createElement("input");
                checkbox.type = "checkbox";
                checkbox.value = item.href;
                checkbox.dataset.name = item.innerText.trim();
                checkbox.style.marginRight = "5px";

                const label = document.createElement("label");
                label.textContent = item.innerText.trim();

                categoryContainer.appendChild(checkbox);
                categoryContainer.appendChild(label);
                categoryContainer.appendChild(document.createElement("br"));
            });
        }
    };
})();
