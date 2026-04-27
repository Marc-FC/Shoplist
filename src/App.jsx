import React, { useState, useEffect } from 'react';
import './App.css';

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
  '🍿': 'Snacks',
  '🧃': 'Bebidas',
  '🍷': 'Vinos',
  '🫒': 'Aceites',
  '🧹': 'Limpieza',
  '💊': 'Medicinas',
  '💪': 'Suplementos',
  '💄': 'Cosméticos',
  '🏠': 'Otros',
};

const categoryEmojis = [
  '🍎', '🥛', '🧀', '🥕', '🥫', '🍞', '🌶️', '🧂',
  '🍖', '🐟', '🍿', '🧃', '🍷', '🫒', '🧹', '💊', '💪', '💄', '🏠'
];

export default function App() {
  const [lists, setLists] = useState([]);
  const [currentListId, setCurrentListId] = useState(null);
  const [productInput, setProductInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('🍎');
  const [notesInput, setNotesInput] = useState('');
  const [storeInput, setStoreInput] = useState('');
  const [optionalFieldsExpanded, setOptionalFieldsExpanded] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [editingProduct, setEditingProduct] = useState(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [newListModalVisible, setNewListModalVisible] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [suggestedProducts, setSuggestedProducts] = useState([]);
  const ALL_PRODUCTS_LIST_ID = 0;

  useEffect(() => {
    loadData();
  }, []);

  const saveData = async (newLists) => {
    try {
      localStorage.setItem('shoppingLists', JSON.stringify(newLists));
    } catch (error) {
      console.error('Error saving data:', error);
    }
  };

  const loadData = () => {
    try {
      const savedData = localStorage.getItem('shoppingLists');
      if (savedData) {
        const parsedLists = JSON.parse(savedData);
        setLists(parsedLists);
        if (parsedLists.length > 0) {
          setCurrentListId(parsedLists[0].id);
        }
      } else {
        const miListaNormal = {
          id: ALL_PRODUCTS_LIST_ID,
          name: 'Todos mis productos',
          products: [],
        };
        const miLista = {
          id: Date.now(),
          name: 'Mi Lista',
          products: [],
        };
        const initialLists = [miListaNormal, miLista];
        setLists(initialLists);
        setCurrentListId(miLista.id);
        localStorage.setItem('shoppingLists', JSON.stringify(initialLists));
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const createNewList = (name) => {
    if (!name.trim()) {
      alert('Escribe un nombre para la lista');
      return;
    }

    const newList = {
      id: Date.now(),
      name: name.trim(),
      products: [],
    };

    const newLists = [...lists, newList];
    setLists(newLists);
    setCurrentListId(newList.id);
    setNewListModalVisible(false);
    setNewListName('');
    saveData(newLists);
  };

  const deleteCurrentList = async () => {
    if (currentListId === ALL_PRODUCTS_LIST_ID) {
      alert('No puedes eliminar la lista "Todos mis productos"');
      return;
    }

    if (lists.length === 1) {
      alert('No puedes eliminar la única lista. Crea una nueva primero.');
      return;
    }

    const updatedLists = lists.filter(l => l.id !== currentListId);
    setLists(updatedLists);
    setCurrentListId(updatedLists[0].id);
    saveData(updatedLists);
  };

  const getCurrentList = () => lists.find(l => l.id === currentListId);

  const addProduct = () => {
    if (!productInput.trim()) {
      alert('Escribe el nombre del producto');
      return;
    }

    if (!optionalFieldsExpanded) {
      setOptionalFieldsExpanded(true);
      return;
    }

    const currentList = getCurrentList();
    if (!currentList) return;

    const newProduct = {
      id: Date.now(),
      name: productInput.trim(),
      category: selectedCategory,
      completed: false,
      notes: notesInput.trim() || undefined,
      store: storeInput.trim() || undefined,
    };

    const updatedList = { ...currentList, products: [...currentList.products, newProduct] };
    let updatedLists = lists.map(l => l.id === currentListId ? updatedList : l);

    if (currentListId !== ALL_PRODUCTS_LIST_ID) {
      updatedLists = updatedLists.map(l =>
        l.id === ALL_PRODUCTS_LIST_ID
          ? { ...l, products: [...l.products, newProduct] }
          : l
      );
    }

    setLists(updatedLists);
    saveData(updatedLists);

    setProductInput('');
    setNotesInput('');
    setStoreInput('');
    setOptionalFieldsExpanded(false);
    setSelectedCategory('🍎');
    setSuggestedProducts([]);
  };

  const toggleProduct = (id) => {
    const currentList = getCurrentList();
    if (!currentList) return;

    const updatedList = {
      ...currentList,
      products: currentList.products.map(p =>
        p.id === id ? { ...p, completed: !p.completed } : p
      ),
    };
    const updatedLists = lists.map(l => l.id === currentListId ? updatedList : l);
    setLists(updatedLists);
    saveData(updatedLists);
  };

  const deleteProduct = (id, productName) => {
    if (window.confirm(`¿Seguro que quieres eliminar "${productName}"?`)) {
      const currentList = getCurrentList();
      if (!currentList) return;

      const updatedList = {
        ...currentList,
        products: currentList.products.filter(p => p.id !== id),
      };
      const updatedLists = lists.map(l => l.id === currentListId ? updatedList : l);
      setLists(updatedLists);
      saveData(updatedLists);
    }
  };

  const openEditModal = (product) => {
    setEditingProduct({ ...product });
    setEditModalVisible(true);
  };

  const saveProductEdit = () => {
    if (!editingProduct) return;

    const currentList = getCurrentList();
    if (!currentList) return;

    const updatedList = {
      ...currentList,
      products: currentList.products.map(p =>
        p.id === editingProduct.id ? editingProduct : p
      ),
    };
    const updatedLists = lists.map(l => l.id === currentListId ? updatedList : l);
    setLists(updatedLists);
    saveData(updatedLists);
    setEditModalVisible(false);
  };

  const groupByCategory = (products) => {
    const grouped = {};
    products.forEach(product => {
      const category = product.category || '🏠';
      if (!grouped[category]) grouped[category] = [];
      grouped[category].push(product);
    });
    return grouped;
  };

  const filterSuggestedProducts = (input) => {
    if (!input.trim()) {
      setSuggestedProducts([]);
      return;
    }
    const allProductsList = lists.find(l => l.id === ALL_PRODUCTS_LIST_ID);
    const allProducts = allProductsList?.products || [];
    const filtered = allProducts.filter(p =>
      p.name.toLowerCase().includes(input.toLowerCase())
    );
    setSuggestedProducts(filtered.slice(0, 5));
  };

  const currentList = getCurrentList();
  const products = currentList?.products || [];
  const grouped = groupByCategory(products);

  return (
    <div className="app-container">
      <div className="background-pattern">
        <span>🍎</span><span>🥕</span><span>🍌</span><span>🥒</span><span>🍓</span>
        <span>🧅</span><span>🥔</span><span>🥬</span><span>🍊</span><span>🍉</span>
        <span>🥦</span><span>🍇</span><span>🥝</span><span>🍅</span><span>🌽</span>
        <span>🥕</span><span>🍎</span><span>🥬</span><span>🍌</span><span>🧄</span>
        <span>🥦</span><span>🍓</span><span>🍊</span><span>🥒</span><span>🍉</span>
      </div>

      <div className="app-header">
        <h1>🛒 ShopList</h1>
        <p>Tu lista de compras inteligente</p>
      </div>

      <div className="app-content">
        {/* List Selector */}
        <div className="section">
          <div className="list-header-row">
            <h2>Mi Lista Actual</h2>
            <button className="new-list-button" onClick={() => setNewListModalVisible(true)}>
              + Nueva
            </button>
          </div>
          <div className="list-buttons-scroll">
            {lists.map(list => (
              <button
                key={list.id}
                className={`list-button ${currentListId === list.id ? 'active' : ''}`}
                onClick={() => setCurrentListId(list.id)}
              >
                {list.name}
              </button>
            ))}
          </div>
          {currentListId !== ALL_PRODUCTS_LIST_ID && (
            <button className="delete-list-button" onClick={deleteCurrentList}>
              🗑️ Eliminar esta lista
            </button>
          )}
        </div>

        {/* Add Product Form */}
        <div className="section">
          <input
            type="text"
            className="product-input"
            placeholder="¿Qué necesitas comprar?"
            value={productInput}
            onChange={(e) => {
              setProductInput(e.target.value);
              filterSuggestedProducts(e.target.value);
            }}
          />

          {suggestedProducts.length > 0 && (
            <div className="suggestions-container">
              {suggestedProducts.map(product => (
                <div
                  key={product.id}
                  className="suggestion-item"
                  onClick={() => {
                    setProductInput(product.name);
                    setSuggestedProducts([]);
                    setSelectedCategory(product.category);
                  }}
                >
                  <span className="suggestion-emoji">{product.category}</span>
                  <div className="suggestion-content">
                    <div className="suggestion-name">{product.name}</div>
                    {product.store && (
                      <div className="suggestion-store">{product.store}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <button
            className="category-selector"
            onClick={() => setCategoryModalVisible(true)}
          >
            <span>Categoría</span>
            <span className="category-value">
              {selectedCategory} {categoryNames[selectedCategory]}
            </span>
          </button>

          {optionalFieldsExpanded && (
            <div className="optional-fields">
              <input
                type="text"
                className="input-field"
                placeholder="Tienda (ej: Carrefour)"
                value={storeInput}
                onChange={(e) => setStoreInput(e.target.value)}
              />
              <textarea
                className="input-field"
                placeholder="Notas"
                value={notesInput}
                onChange={(e) => setNotesInput(e.target.value)}
              />
            </div>
          )}

          <div className="button-row">
            <button className="camera-button" onClick={() => alert('Cámara no disponible en web')}>
              📷 Cámara
            </button>
            <button className="add-button" onClick={addProduct}>
              {optionalFieldsExpanded ? '✓ Agregar' : '+ Agregar'}
            </button>
          </div>
        </div>

        {/* Products List */}
        <div className="products-section">
          {products.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🛍️</div>
              <div className="empty-text">Tu lista está vacía</div>
              <div className="empty-hint">¡Empieza a agregar productos!</div>
            </div>
          ) : (
            Object.entries(grouped).map(([category, items]) => {
              const isExpanded = expandedCategories[category];
              return (
                <div key={category}>
                  <button
                    className="category-header"
                    onClick={() =>
                      setExpandedCategories({
                        ...expandedCategories,
                        [category]: !isExpanded,
                      })
                    }
                  >
                    {isExpanded ? '▼' : '▶'} {category} {categoryNames[category]} ({items.length})
                  </button>

                  {isExpanded &&
                    items.map(product => (
                      <div key={product.id} className="product-item">
                        <input
                          type="checkbox"
                          className="product-checkbox"
                          checked={product.completed}
                          onChange={() => toggleProduct(product.id)}
                        />
                        <div className="product-info">
                          <div className={`product-name ${product.completed ? 'completed' : ''}`}>
                            {product.name}
                          </div>
                          {product.store && (
                            <div className="product-store">🏪 {product.store}</div>
                          )}
                          {product.notes && (
                            <div className="product-notes">📝 {product.notes}</div>
                          )}
                        </div>
                        <div className="product-actions">
                          <button
                            className="edit-button"
                            onClick={() => openEditModal(product)}
                          >
                            ✏️
                          </button>
                          <button
                            className="delete-button"
                            onClick={() => deleteProduct(product.id, product.name)}
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* New List Modal */}
      {newListModalVisible && (
        <div className="modal-overlay" onClick={() => setNewListModalVisible(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Nueva Lista</h3>
              <button className="modal-close" onClick={() => setNewListModalVisible(false)}>
                ✕
              </button>
            </div>
            <input
              type="text"
              className="input-field"
              placeholder="Nombre de la lista (ej: Compra Semanal)"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              autoFocus
            />
            <div className="modal-buttons">
              <button className="modal-button" onClick={() => setNewListModalVisible(false)}>
                Cancelar
              </button>
              <button
                className="modal-button save"
                onClick={() => createNewList(newListName)}
              >
                Crear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {categoryModalVisible && (
        <div className="modal-overlay" onClick={() => setCategoryModalVisible(false)}>
          <div className="modal-content category-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Selecciona una categoría</h3>
              <button className="modal-close" onClick={() => setCategoryModalVisible(false)}>
                ✕
              </button>
            </div>
            <div className="categories-grid">
              {categoryEmojis.map(emoji => (
                <button
                  key={emoji}
                  className={`category-item ${selectedCategory === emoji ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedCategory(emoji);
                    setCategoryModalVisible(false);
                  }}
                >
                  <span className="category-emoji">{emoji}</span>
                  <span className="category-name">{categoryNames[emoji]}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModalVisible && editingProduct && (
        <div className="modal-overlay" onClick={() => setEditModalVisible(false)}>
          <div className="modal-content edit-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Editar Producto</h3>
              <button className="modal-close" onClick={() => setEditModalVisible(false)}>
                ✕
              </button>
            </div>

            <div className="edit-form">
              <input
                type="text"
                className="input-field"
                value={editingProduct.name}
                onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                placeholder="Nombre"
              />
              <input
                type="text"
                className="input-field"
                value={editingProduct.store || ''}
                onChange={(e) => setEditingProduct({ ...editingProduct, store: e.target.value })}
                placeholder="Tienda"
              />
              <textarea
                className="input-field"
                value={editingProduct.notes || ''}
                onChange={(e) => setEditingProduct({ ...editingProduct, notes: e.target.value })}
                placeholder="Notas"
              />
              <button
                className="category-selector"
                onClick={() => setCategoryModalVisible(true)}
              >
                <span>Categoría</span>
                <span className="category-value">
                  {editingProduct.category} {categoryNames[editingProduct.category]}
                </span>
              </button>
            </div>

            <div className="modal-buttons">
              <button className="modal-button" onClick={() => setEditModalVisible(false)}>
                Cancelar
              </button>
              <button className="modal-button save" onClick={saveProductEdit}>
                Guardar cambios
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
