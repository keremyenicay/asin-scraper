// Eklentiyi aktif et butonu ekleyelim ve filtreyi düzgün yükleyelim
(function() {
    'use strict';

    // Eklentiyi aktif et butonu oluştur
    function createActivateButton() {
        let button = document.createElement('button');
        button.innerText = 'Eklentiyi Aktif Et';
        button.style.position = 'fixed';
        button.style.top = '10px';
        button.style.right = '10px';
        button.style.backgroundColor = 'yellow';
        button.style.color = 'black';
        button.style.padding = '10px';
        button.style.border = 'none';
        button.style.cursor = 'pointer';
        button.style.zIndex = '9999';
        document.body.appendChild(button);
        
        button.addEventListener('click', function() {
            button.remove();
            showCategorySelection();
        });
    }

    // Kategori seçim ekranını göster
    function showCategorySelection() {
        let container = document.createElement('div');
        container.id = 'category-container';
        container.style.position = 'fixed';
        container.style.top = '50px';
        container.style.left = '50%';
        container.style.transform = 'translateX(-50%)';
        container.style.width = '600px';
        container.style.height = '400px';
        container.style.backgroundColor = 'white';
        container.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.5)';
        container.style.overflowY = 'scroll';
        container.style.padding = '20px';
        container.style.zIndex = '9999';
        document.body.appendChild(container);
        
        // Kategorileri yükle
        loadCategories(container);
    }

    // Kategorileri getir ve listeye ekle
    function loadCategories(container) {
        let categories = ["Electronics", "Automotive", "Home & Kitchen", "Toys & Games", "Clothing", "Books"];
        let categoryList = document.createElement('div');

        categories.forEach(category => {
            let label = document.createElement('label');
            let checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = category;
            label.appendChild(checkbox);
            label.appendChild(document.createTextNode(' ' + category));
            categoryList.appendChild(label);
            categoryList.appendChild(document.createElement('br'));
        });
        
        container.appendChild(categoryList);
    }

    createActivateButton();
})();
