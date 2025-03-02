document.addEventListener("DOMContentLoaded", function () {
    "use strict";

    function createActivateButton() {
        let button = document.createElement("button");
        button.innerText = "Eklentiyi Aktif Et";
        button.style.position = "fixed";
        button.style.top = "10px";
        button.style.right = "10px";
        button.style.background = "yellow";
        button.style.color = "black";
        button.style.padding = "10px";
        button.style.border = "none";
        button.style.cursor = "pointer";
        button.style.zIndex = "9999";
        button.onclick = openCategorySelection;
        document.body.appendChild(button);
    }

    function openCategorySelection() {
        if (document.getElementById("categoryContainer")) return;

        let container = document.createElement("div");
        container.id = "categoryContainer";
        container.style.position = "fixed";
        container.style.top = "50px";
        container.style.left = "50%";
        container.style.transform = "translateX(-50%)";
        container.style.width = "400px";
        container.style.height = "500px";
        container.style.background = "white";
        container.style.border = "2px solid black";
        container.style.padding = "10px";
        container.style.overflowY = "scroll";
        container.style.zIndex = "10000";

        let categoryList = ["Electronics", "Books", "Home & Kitchen", "Toys"];
        categoryList.forEach(category => {
            let label = document.createElement("label");
            let checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.value = category;
            label.appendChild(checkbox);
            label.appendChild(document.createTextNode(category));
            container.appendChild(label);
            container.appendChild(document.createElement("br"));
        });

        let startButton = document.createElement("button");
        startButton.innerText = "Taramayı Başlat";
        startButton.onclick = startScraping;
        container.appendChild(startButton);

        document.body.appendChild(container);
    }

    function startScraping() {
        alert("Tarama başlatıldı! (Detaylı fonksiyon eklenecek)");
    }

    createActivateButton();
});
