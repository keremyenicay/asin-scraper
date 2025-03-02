// main.js - Güncellenmiş Versiyon

(function () {
    'use strict';

    const STORAGE_KEY = 'savedFilters';
    let savedFilters = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};

    function saveFilter(name, categories) {
        savedFilters[name] = categories;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(savedFilters));
    }

    function loadFilter(name) {
        return savedFilters[name] || [];
    }

    function createUI() {
        const container = document.createElement('div');
        container.style.position = 'fixed';
        container.style.top = '50px';
        container.style.left = '50px';
        container.style.width = '400px';
        container.style.height = '500px';
        container.style.background = 'white';
        container.style.zIndex = '9999';
        container.style.overflowY = 'auto';
        container.style.padding = '10px';
        container.style.border = '1px solid black';

        const title = document.createElement('h3');
        title.innerText = 'Kategori Seçimi';
        container.appendChild(title);

        const filterSelect = document.createElement('select');
        filterSelect.innerHTML = '<option value="">Filtre Seç</option>' + 
            Object.keys(savedFilters).map(f => `<option value="${f}">${f}</option>`).join('');
        filterSelect.addEventListener('change', function() {
            const selectedFilter = filterSelect.value;
            if (selectedFilter) {
                const categories = loadFilter(selectedFilter);
                document.querySelectorAll('.category-checkbox').forEach(cb => {
                    cb.checked = categories.includes(cb.value);
                });
            }
        });
        container.appendChild(filterSelect);

        const categoryList = document.createElement('div');
        categoryList.style.maxHeight = '300px';
        categoryList.style.overflowY = 'scroll';
        container.appendChild(categoryList);

        const categories = ['Electronics', 'Books', 'Home & Kitchen', 'Toys']; // Örnek kategoriler
        categories.forEach(category => {
            const label = document.createElement('label');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'category-checkbox';
            checkbox.value = category;
            label.appendChild(checkbox);
            label.appendChild(document.createTextNode(category));
            categoryList.appendChild(label);
            categoryList.appendChild(document.createElement('br'));
        });

        const saveFilterBtn = document.createElement('button');
        saveFilterBtn.innerText = 'Filtreyi Kaydet';
        saveFilterBtn.addEventListener('click', function () {
            const selectedCategories = [...document.querySelectorAll('.category-checkbox:checked')].map(cb => cb.value);
            const filterName = prompt('Filtre Adı Girin:');
            if (filterName) {
                saveFilter(filterName, selectedCategories);
                alert('Filtre kaydedildi!');
            }
        });
        container.appendChild(saveFilterBtn);

        document.body.appendChild(container);
    }

    createUI();
})();
