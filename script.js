// Seleccionar elementos
const productInput = document.getElementById('productInput');
const addBtn = document.getElementById('addBtn');
const cameraBtn = document.getElementById('cameraBtn');
const photoInput = document.getElementById('photoInput');
const categorySelect = document.getElementById('categorySelect');
const notesInput = document.getElementById('notesInput');
const storeInput = document.getElementById('storeInput');
const productList = document.getElementById('productList');
const emptyMessage = document.getElementById('emptyMessage');
const listSelect = document.getElementById('listSelect');
const newListBtn = document.getElementById('newListBtn');
const newListForm = document.getElementById('newListForm');
const newListInput = document.getElementById('newListInput');
const createListBtn = document.getElementById('createListBtn');
const cancelListBtn = document.getElementById('cancelListBtn');
const listTitle = document.getElementById('listTitle');
const productCount = document.getElementById('productCount');
const suggestionsList = document.getElementById('suggestionsList');
const searchBtn = document.getElementById('searchBtn');
const productModal = document.getElementById('productModal');
const modalOverlay = document.getElementById('modalOverlay');
const productInfo = document.getElementById('productInfo');
const addProductFromScanBtn = document.getElementById('addProductFromScanBtn');

// Estructura de datos
let lists = [];
let productHistory = [];
let currentListId = null;
let currentPhoto = null;
let expandedCategories = {};

// Mapa de categorías (emoji a nombre)
const categoryNames = {
    '🍎': 'Frutas',
    '🥛': 'Lácteos',
    '🧀': 'Quesos',
    '🥕': 'Verduras',
    '🥫': 'Conservas',
    '🍞': 'Panadería',
    '🌶️': 'Salsas',
    '🧂': 'Condimentos',
    '🍖': 'Carnes',
    '🐟': 'Pescado',
    '🍬': 'Snacks',
    '🧃': 'Bebidas',
    '🍷': 'Vinos',
    '🧹': 'Limpieza',
    '💊': 'Medicinas',
    '💪': 'Suplementos',
    '💄': 'Cosméticos',
    '🏠': 'Otros'
};

// Cargar datos
function loadData() {
    try {
        const saved = localStorage.getItem('lists');
        const savedHistory = localStorage.getItem('productHistory');

        console.log('📦 Cargando datos...');
        console.log('Listas guardadas:', saved);

        if (saved) {
            lists = JSON.parse(saved);
            if (lists.length > 0) {
                currentListId = lists[0].id;
                renderListSelect();
                render();
                console.log('✅ Listas cargadas:', lists);
            }
        } else {
            console.log('📝 Creando lista por defecto...');
            createNewList('Mi Lista');
        }

        if (savedHistory) {
            productHistory = JSON.parse(savedHistory);
            console.log('✅ Historial cargado:', productHistory);
        }
    } catch (error) {
        console.error('❌ Error al cargar:', error);
    }
}

// Guardar datos
function saveData() {
    try {
        localStorage.setItem('lists', JSON.stringify(lists));
        localStorage.setItem('productHistory', JSON.stringify(productHistory));
        console.log('✅ Datos guardados:', lists);
    } catch (error) {
        console.error('❌ Error al guardar:', error);
    }
}

// Crear nueva lista
function createNewList(name) {
    const newList = {
        id: Date.now(),
        name: name || 'Nueva Lista',
        products: []
    };
    lists.push(newList);
    currentListId = newList.id;
    saveData();
    renderListSelect();
    render();
}

// Obtener lista actual
function getCurrentList() {
    return lists.find(l => l.id === currentListId);
}

// Obtener productos de la lista actual
function getCurrentProducts() {
    const list = getCurrentList();
    return list ? list.products : [];
}

// Agregar producto a la lista actual
function addProduct() {
    const productName = productInput.value.trim();
    const category = categorySelect.value;
    const notes = notesInput.value.trim();
    const store = storeInput.value.trim();

    if (productName === '') {
        alert('Escribe el nombre del producto');
        return;
    }

    const currentList = getCurrentList();
    if (!currentList) return;

    const newProduct = {
        id: Date.now(),
        name: productName,
        category: category,
        completed: false,
        photo: currentPhoto,
        notes: notes,
        store: store
    };

    currentList.products.push(newProduct);

    // Agregar al historial si no existe
    const existsInHistory = productHistory.some(p =>
        p.name.toLowerCase() === productName.toLowerCase()
    );
    if (!existsInHistory) {
        productHistory.push({
            name: productName,
            category: category
        });
    }

    productInput.value = '';
    notesInput.value = '';
    storeInput.value = '';
    currentPhoto = null;
    cameraBtn.textContent = '📷';
    cameraBtn.style.background = '#20c997';
    suggestionsList.style.display = 'none';

    saveData();
    render();
    productInput.focus();
}

// Marcar producto como comprado
function toggleProduct(id) {
    const currentList = getCurrentList();
    if (!currentList) return;

    const product = currentList.products.find(p => p.id === id);
    if (product) {
        product.completed = !product.completed;
        saveData();
        render();
    }
}

// Eliminar producto
function deleteProduct(id) {
    const currentList = getCurrentList();
    if (!currentList) return;

    currentList.products = currentList.products.filter(p => p.id !== id);
    saveData();
    render();
}

// Cambiar lista seleccionada
function switchList(listId) {
    currentListId = listId;
    render();
}

// Agrupar productos por categoría
function groupByCategory(products) {
    const grouped = {};
    products.forEach(product => {
        const category = product.category || '🏠';
        if (!grouped[category]) {
            grouped[category] = [];
        }
        grouped[category].push(product);
    });
    return grouped;
}

// Renderizar selector de listas
function renderListSelect() {
    listSelect.innerHTML = '';
    lists.forEach(list => {
        const option = document.createElement('option');
        option.value = list.id;
        option.textContent = list.name;
        if (list.id === currentListId) {
            option.selected = true;
        }
        listSelect.appendChild(option);
    });
}

// Renderizar lista de productos
function render() {
    const products = getCurrentProducts();
    const currentList = getCurrentList();

    // Actualizar título y contador
    if (currentList) {
        listTitle.textContent = currentList.name;
    }

    productCount.textContent = `${products.length} ${products.length === 1 ? 'producto' : 'productos'}`;

    productList.innerHTML = '';

    if (products.length === 0) {
        emptyMessage.classList.add('show');
        return;
    }

    emptyMessage.classList.remove('show');

    const grouped = groupByCategory(products);

    Object.entries(grouped).forEach(([category, items]) => {
        // Por defecto las carpetas están cerradas (false), se abren solo al hacer click
        const isExpanded = expandedCategories[category] === true;

        // Crear header de la categoría (carpeta)
        const categoryHeader = document.createElement('li');
        categoryHeader.className = 'category-header';
        const categoryName = categoryNames[category] || category;
        categoryHeader.innerHTML = `
            <div class="category-header-content">
                <span class="category-toggle">${isExpanded ? '▼' : '▶'}</span>
                <span class="category-name">${category} ${categoryName}</span>
                <span class="category-count">${items.length}</span>
            </div>
        `;
        categoryHeader.addEventListener('click', () => {
            expandedCategories[category] = !isExpanded;
            render();
        });
        productList.appendChild(categoryHeader);

        // Contenedor de productos de la categoría
        if (isExpanded) {
            const categoryContainer = document.createElement('li');
            categoryContainer.className = 'category-container';

            items.forEach(product => {
                const li = document.createElement('li');
                li.className = `product-item ${product.completed ? 'completed' : ''}`;

                let content = '';

                if (product.photo) {
                    content += `<img src="${product.photo}" class="product-image" alt="${product.name}">`;
                } else {
                    content += `<div class="product-image" style="background: #ddd; display: flex; align-items: center; justify-content: center; color: #999;">Sin foto</div>`;
                }

                content += `
                    <div style="display: flex; flex-direction: column; gap: 6px; flex: 1;">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <input
                                type="checkbox"
                                class="checkbox"
                                ${product.completed ? 'checked' : ''}
                                onchange="toggleProduct(${product.id})"
                            >
                            <span class="product-name">${product.name}</span>
                        </div>
                        ${product.store ? `<div style="font-size: 12px; color: #666; padding-left: 32px;">🏪 ${product.store}</div>` : ''}
                        ${product.notes ? `<div style="font-size: 12px; color: #888; padding-left: 32px; font-style: italic;">📝 ${product.notes}</div>` : ''}
                    </div>
                `;

                content += `
                    <div style="display: flex; flex-direction: column; gap: 8px;">
                        <button class="edit-btn" onclick="editProduct(${product.id})">
                            ✏️
                        </button>
                        <button class="delete-btn" onclick="deleteProduct(${product.id})">
                            ✕
                        </button>
                    </div>
                `;

                li.innerHTML = content;
                categoryContainer.appendChild(li);
            });

            productList.appendChild(categoryContainer);
        }
    });
}

// Eventos
addBtn.addEventListener('click', addProduct);
productInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        addProduct();
    }
});

productInput.addEventListener('input', (e) => {
    showSuggestions(e.target.value);
});

listSelect.addEventListener('change', (e) => {
    switchList(parseInt(e.target.value));
});

newListBtn.addEventListener('click', () => {
    newListForm.style.display = 'flex';
    newListInput.focus();
});

createListBtn.addEventListener('click', () => {
    const name = newListInput.value.trim();
    if (name === '') {
        alert('Escribe un nombre para la lista');
        return;
    }
    createNewList(name);
    newListForm.style.display = 'none';
    newListInput.value = '';
});

cancelListBtn.addEventListener('click', () => {
    newListForm.style.display = 'none';
    newListInput.value = '';
});

// Fotos
cameraBtn.addEventListener('click', () => {
    photoInput.click();
});

photoInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            currentPhoto = event.target.result;
            cameraBtn.textContent = '✓📷';
            cameraBtn.style.background = '#ffc107';
        };
        reader.readAsDataURL(file);
    }
});

// Mostrar sugerencias
function showSuggestions(searchText) {
    if (searchText.length < 1) {
        suggestionsList.style.display = 'none';
        return;
    }

    const filtered = productHistory.filter(p =>
        p.name.toLowerCase().includes(searchText.toLowerCase())
    ).slice(0, 8);

    if (filtered.length === 0) {
        suggestionsList.style.display = 'none';
        return;
    }

    suggestionsList.innerHTML = '';
    filtered.forEach(product => {
        const li = document.createElement('li');
        li.className = 'suggestion-item';
        li.innerHTML = `
            <span class="suggestion-item-name">${product.name}</span>
            <span class="suggestion-item-category">${product.category}</span>
        `;
        li.addEventListener('click', () => {
            productInput.value = product.name;
            categorySelect.value = product.category;
            suggestionsList.style.display = 'none';
            productInput.focus();
        });
        suggestionsList.appendChild(li);
    });

    suggestionsList.style.display = 'block';
}

// Esconder sugerencias al hacer click fuera
document.addEventListener('click', (e) => {
    if (e.target !== productInput && e.target !== suggestionsList) {
        suggestionsList.style.display = 'none';
    }
});

// Funciones para escaneo de códigos de barras
let scannedProduct = null;

function closeProductModal() {
    productModal.style.display = 'none';
    modalOverlay.style.display = 'none';
    scannedProduct = null;
}

// Funciones para editar producto
const editModal = document.getElementById('editModal');
const editModalOverlay = document.getElementById('editModalOverlay');
const editProductName = document.getElementById('editProductName');
const editCategorySelect = document.getElementById('editCategorySelect');
const editStoreInput = document.getElementById('editStoreInput');
const editNotesInput = document.getElementById('editNotesInput');
const editCameraBtn = document.getElementById('editCameraBtn');
const editPhotoInput = document.getElementById('editPhotoInput');
const editPhotoPreview = document.getElementById('editPhotoPreview');
const saveEditBtn = document.getElementById('saveEditBtn');

let editingProductId = null;
let editingListId = null;
let editingNewPhoto = null;

function editProduct(id) {
    const currentList = getCurrentList();
    if (!currentList) return;

    const product = currentList.products.find(p => p.id === id);
    if (!product) return;

    editingProductId = id;
    editingListId = currentList.id;
    editingNewPhoto = null;

    // Llenar el formulario con los datos del producto
    editProductName.value = product.name;
    editCategorySelect.value = product.category;
    editStoreInput.value = product.store || '';
    editNotesInput.value = product.notes || '';

    // Mostrar foto actual
    if (product.photo) {
        editPhotoPreview.innerHTML = `<img src="${product.photo}" style="width: 100%; height: 100%; object-fit: cover;">`;
    } else {
        editPhotoPreview.innerHTML = 'Sin foto';
    }

    // Mostrar modal
    editModal.style.display = 'flex';
    editModalOverlay.style.display = 'block';
    editProductName.focus();
}

function closeEditModal() {
    editModal.style.display = 'none';
    editModalOverlay.style.display = 'none';
    editingProductId = null;
    editingListId = null;
    editingNewPhoto = null;
}

function saveProductEdit() {
    if (!editingProductId || !editingListId) return;

    const list = lists.find(l => l.id === editingListId);
    if (!list) return;

    const product = list.products.find(p => p.id === editingProductId);
    if (!product) return;

    const newName = editProductName.value.trim();
    if (newName === '') {
        alert('Escribe el nombre del producto');
        return;
    }

    // Actualizar datos del producto
    product.name = newName;
    product.category = editCategorySelect.value;
    product.store = editStoreInput.value.trim();
    product.notes = editNotesInput.value.trim();

    // Si se capturó una nueva foto, usar esa
    if (editingNewPhoto) {
        product.photo = editingNewPhoto;
    }

    saveData();
    render();
    closeEditModal();
}

// Event listeners para editar modal
editCameraBtn.addEventListener('click', () => {
    editPhotoInput.click();
});

editPhotoInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            editingNewPhoto = event.target.result;
            editPhotoPreview.innerHTML = `<img src="${editingNewPhoto}" style="width: 100%; height: 100%; object-fit: cover;">`;
        };
        reader.readAsDataURL(file);
    }
});

saveEditBtn.addEventListener('click', saveProductEdit);

async function searchProductByName() {
    const query = productInput.value.trim();
    if (!query) {
        alert('Escribe un nombre de producto');
        return;
    }

    productModal.style.display = 'flex';
    modalOverlay.style.display = 'block';
    productInfo.innerHTML = '<div class="product-loading">🔍 Buscando productos...</div>';

    try {
        const response = await fetch(
            `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&json=1&page_size=5`
        );
        const data = await response.json();

        if (data.products && data.products.length > 0) {
            showSearchResults(data.products);
        } else {
            productInfo.innerHTML = '<div class="product-error">⚠️ No se encontraron productos</div>';
        }
    } catch (error) {
        console.error(error);
        productInfo.innerHTML = '<div class="product-error">❌ Error en la búsqueda</div>';
    }
}

function showSearchResults(products) {
    let html = '<div style="text-align: left; max-height: 400px; overflow-y: auto;">';

    products.forEach(product => {
        const name = product.product_name || 'Producto';
        const brand = product.brands || 'Sin marca';
        html += `
            <div style="padding: 12px; border-bottom: 1px solid #eee; cursor: pointer; transition: background 0.2s;" onclick="selectProduct('${name.replace(/'/g, "\\'")}', '${brand.replace(/'/g, "\\'")}')">
                <div style="font-weight: 600; color: #333;">${name}</div>
                <div style="font-size: 12px; color: #999;">${brand}</div>
            </div>
        `;
    });

    html += '</div>';
    productInfo.innerHTML = html;
}

function selectProduct(name, brand) {
    productInput.value = name;
    closeProductModal();
    productInput.focus();
}

async function searchProduct(barcode) {
    try {
        productInfo.innerHTML = '<div class="product-loading">🔍 Buscando producto...</div>';

        const response = await fetch(
            `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`
        );
        const data = await response.json();

        if (data.status === 1 && data.product) {
            scannedProduct = data.product;
            showProductInfo(data.product);
        } else {
            productInfo.innerHTML = `<div class="product-error">⚠️ Producto no encontrado<br><small>Código: ${barcode}</small></div>`;
        }
    } catch (error) {
        productInfo.innerHTML = `<div class="product-error">❌ Error en la búsqueda</div>`;
    }
}

function showProductInfo(product) {
    let html = '<div class="product-detail">';
    html += `<div class="detail-item"><span class="detail-label">Producto</span><span class="detail-value">${product.product_name || 'N/A'}</span></div>`;
    if (product.brands) html += `<div class="detail-item"><span class="detail-label">Marca</span><span class="detail-value">${product.brands}</span></div>`;
    if (product.categories) html += `<div class="detail-item"><span class="detail-label">Categoría</span><span class="detail-value">${product.categories}</span></div>`;
    if (product.ingredients_text) html += `<div class="detail-item"><span class="detail-label">Ingredientes</span><span class="detail-value" style="font-size: 14px;">${product.ingredients_text}</span></div>`;
    html += '</div>';
    productInfo.innerHTML = html;
}

searchBtn.addEventListener('click', searchProductByName);

// Cargar al abrir (cuando el DOM está listo)
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadData);
} else {
    loadData();
}
