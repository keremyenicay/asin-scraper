(function() {
    'use strict';

    console.log("✅ main.js başarıyla yüklendi!");

    function getCategories() {
        const categories = [];
        document.querySelectorAll(".s-navigation-item").forEach(item => {
            categories.push(item.innerText.trim());
        });
        return categories;
    }

    function getASINs() {
        const asins = [];
        document.querySelectorAll("div[data-asin]").forEach(item => {
            const asin = item.getAttribute("data-asin");
            if (asin) asins.push(asin);
        });
        return asins;
    }

    function displayCategories(categories) {
        const container = document.createElement("div");
        container.style.position = "fixed";
        container.style.top = "50px";
        container.style.right = "10px";
        container.style.backgroundColor = "yellow";
        container.style.padding = "10px";
        container.style.border = "2px solid black";
        container.innerHTML = "<b>Kategoriler:</b><br>";

        categories.forEach(category => {
            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.value = category;
            checkbox.style.marginRight = "5px";

            const label = document.createElement("label");
            label.textContent = category;

            container.appendChild(checkbox);
            container.appendChild(label);
            container.appendChild(document.createElement("br"));
        });

        document.body.appendChild(container);
    }

    const categories = getCategories();
    displayCategories(categories);

    console.log("Bulunan ASIN'ler:", getASINs());
})();
