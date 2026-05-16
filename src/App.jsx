import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import { supabase } from './supabase';
import { languageNames, t } from './i18n';

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
  const [loading, setLoading] = useState(true);
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
  const [language, setLanguage] = useState('es');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);

  const catalogListIdRef = useRef(null);
  const tr = (key) => t(key, language);

  useEffect(() => {
    initializeApp();
  }, []);

  useEffect(() => {
    const savedLang = localStorage.getItem('appLanguage');
    const savedDark = localStorage.getItem('appDarkMode');
    if (savedLang) setLanguage(savedLang);
    if (savedDark) setIsDarkMode(savedDark === 'true');
  }, []);

  const updateLanguage = (lang) => {
    setLanguage(lang);
    localStorage.setItem('appLanguage', lang);
  };

  const updateDarkMode = (value) => {
    setIsDarkMode(value);
    localStorage.setItem('appDarkMode', String(value));
  };

  const initializeApp = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        const { data, error } = await supabase.auth.signInAnonymously();
        if (error) throw error;
      }

      await loadData();
    } catch (error) {
      console.error('Error initializing app:', error);
      alert('Error al cargar datos. Por favor recarga la página.');
    } finally {
      setLoading(false);
    }
  };

  const loadData = async () => {
    try {
      const { data, error } = await supabase
        .from('lists')
        .select('*, products(*)')
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (!data || data.length === 0) {
        await createInitialLists();
        return;
      }

      const formattedLists = data.map(list => ({
        ...list,
        products: list.products || [],
      }));

      setLists(formattedLists);

      const catalogList = formattedLists.find(l => l.is_catalog);
      if (catalogList) {
        catalogListIdRef.current = catalogList.id;
      }

      const firstNonCatalog = formattedLists.find(l => !l.is_catalog);
      if (firstNonCatalog) {
        setCurrentListId(firstNonCatalog.id);
      } else if (catalogList) {
        setCurrentListId(catalogList.id);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      alert('Error al cargar datos.');
    }
  };

  const createInitialLists = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      const { data: catalogData, error: catalogError } = await supabase
        .from('lists')
        .insert([
          {
            user_id: user.id,
            name: 'Todos mis productos',
            is_catalog: true,
          },
        ])
        .select();

      if (catalogError) throw catalogError;

      const { data: mainListData, error: mainError } = await supabase
        .from('lists')
        .insert([
          {
            user_id: user.id,
            name: 'Mis Productos',
            is_catalog: false,
          },
        ])
        .select();

      if (mainError) throw mainError;

      const newLists = [catalogData[0], mainListData[0]].map(list => ({
        ...list,
        products: [],
      }));

      setLists(newLists);
      catalogListIdRef.current = catalogData[0].id;
      setCurrentListId(mainListData[0].id);
    } catch (error) {
      console.error('Error creating initial lists:', error);
    }
  };

  const createNewList = async (name) => {
    if (!name.trim()) {
      alert('Escribe un nombre para la lista');
      return;
    }

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      const { data, error } = await supabase
        .from('lists')
        .insert([
          {
            user_id: user.id,
            name: name.trim(),
            is_catalog: false,
          },
        ])
        .select();

      if (error) throw error;

      const newList = { ...data[0], products: [] };
      setLists([...lists, newList]);
      setCurrentListId(newList.id);
      setNewListModalVisible(false);
      setNewListName('');
    } catch (error) {
      console.error('Error creating list:', error);
      alert('Error al crear la lista.');
    }
  };

  const deleteCurrentList = async () => {
    const list = lists.find(l => l.id === currentListId);
    if (list?.is_catalog) {
      alert('No puedes eliminar la lista "Todos mis productos"');
      return;
    }

    if (lists.filter(l => !l.is_catalog).length === 1) {
      alert('No puedes eliminar la única lista. Crea una nueva primero.');
      return;
    }

    try {
      const { error } = await supabase
        .from('lists')
        .delete()
        .eq('id', currentListId);

      if (error) throw error;

      const updatedLists = lists.filter(l => l.id !== currentListId);
      setLists(updatedLists);

      const nextList = updatedLists.find(l => !l.is_catalog) || updatedLists[0];
      setCurrentListId(nextList?.id || null);
    } catch (error) {
      console.error('Error deleting list:', error);
      alert('Error al eliminar la lista.');
    }
  };

  const getCurrentList = () => lists.find(l => l.id === currentListId);

  const addProduct = async () => {
    if (!productInput.trim()) {
      alert('Escribe el nombre del producto');
      return;
    }

    const currentList = getCurrentList();
    if (!currentList) return;

    try {
      const productData = {
        name: productInput.trim(),
        category: selectedCategory,
        completed: false,
        notes: notesInput.trim() || null,
        store: storeInput.trim() || null,
      };

      const productIds = [];

      const { data: mainProduct, error: mainError } = await supabase
        .from('products')
        .insert([{ ...productData, list_id: currentListId }])
        .select();

      if (mainError) throw mainError;
      productIds.push(mainProduct[0]);

      if (currentListId !== catalogListIdRef.current && catalogListIdRef.current) {
        const { data: catalogProduct, error: catalogError } = await supabase
          .from('products')
          .insert([{ ...productData, list_id: catalogListIdRef.current }])
          .select();

        if (catalogError) throw catalogError;
        productIds.push(catalogProduct[0]);
      }

      await loadData();

      setProductInput('');
      setNotesInput('');
      setStoreInput('');
      setOptionalFieldsExpanded(false);
      setSelectedCategory('🍎');
      setSuggestedProducts([]);
    } catch (error) {
      console.error('Error adding product:', error);
      alert('Error al agregar producto.');
    }
  };

  const toggleProduct = async (id) => {
    const currentList = getCurrentList();
    if (!currentList) return;

    const product = currentList.products.find(p => p.id === id);
    if (!product) return;

    try {
      const { error } = await supabase
        .from('products')
        .update({ completed: !product.completed })
        .eq('id', id);

      if (error) throw error;

      await loadData();
    } catch (error) {
      console.error('Error toggling product:', error);
      alert('Error al actualizar producto.');
    }
  };

  const deleteProduct = async (id, productName) => {
    if (window.confirm(`¿Seguro que quieres eliminar "${productName}"?`)) {
      try {
        const { error } = await supabase
          .from('products')
          .delete()
          .eq('id', id);

        if (error) throw error;

        await loadData();
      } catch (error) {
        console.error('Error deleting product:', error);
        alert('Error al eliminar producto.');
      }
    }
  };

  const openEditModal = (product) => {
    setEditingProduct({ ...product });
    setEditModalVisible(true);
  };

  const saveProductEdit = async () => {
    if (!editingProduct) return;

    try {
      const { error } = await supabase
        .from('products')
        .update({
          name: editingProduct.name,
          category: editingProduct.category,
          store: editingProduct.store || null,
          notes: editingProduct.notes || null,
        })
        .eq('id', editingProduct.id);

      if (error) throw error;

      await loadData();
      setEditModalVisible(false);
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Error al guardar cambios.');
    }
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
    const catalogList = lists.find(l => l.is_catalog);
    const allProducts = catalogList?.products || [];
    const filtered = allProducts.filter(p =>
      p.name.toLowerCase().includes(input.toLowerCase())
    );
    setSuggestedProducts(filtered.slice(0, 5));
  };

  if (loading) {
    return (
      <div className={`app-container ${isDarkMode ? 'dark' : ''}`}>
        <div className="app-header">
          <h1>🛒 ShopList</h1>
          <p>{tr('loading')}</p>
        </div>
      </div>
    );
  }

  const currentList = getCurrentList();
  const products = currentList?.products || [];
  const grouped = groupByCategory(products);

  return (
    <div className={`app-container ${isDarkMode ? 'dark' : ''}`}>
      <div className="background-pattern">
        <span>🍎</span><span>🥕</span><span>🍌</span><span>🥒</span><span>🍓</span>
        <span>🧅</span><span>🥔</span><span>🥬</span><span>🍊</span><span>🍉</span>
        <span>🥦</span><span>🍇</span><span>🥝</span><span>🍅</span><span>🌽</span>
        <span>🥕</span><span>🍎</span><span>🥬</span><span>🍌</span><span>🧄</span>
        <span>🥦</span><span>🍓</span><span>🍊</span><span>🥒</span><span>🍉</span>
      </div>

      <div className="app-header">
        <div className="app-header-text">
          <h1>🛒 ShopList</h1>
          <p>{tr('subtitle')}</p>
        </div>
        <button
          className="settings-button"
          onClick={() => setSettingsModalVisible(true)}
          aria-label={tr('settings')}
        >
          ⚙️
        </button>
      </div>

      <div className="app-content">
        {/* List Selector */}
        <div className="section">
          <div className="list-header-row">
            <h2>{tr('myCurrentList')}</h2>
            <button className="new-list-button" onClick={() => setNewListModalVisible(true)}>
              {tr('newList')}
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
          {!currentList?.is_catalog && (
            <button className="delete-list-button" onClick={deleteCurrentList}>
              {tr('deleteList')}
            </button>
          )}
        </div>

        {/* Add Product Form */}
        <div className="section">
          <input
            type="text"
            className="product-input"
            placeholder={tr('whatToBuy')}
            value={productInput}
            onChange={(e) => {
              setProductInput(e.target.value);
              filterSuggestedProducts(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addProduct();
              }
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
            <span>{tr('category')}</span>
            <span className="category-value">
              {selectedCategory} {categoryNames[selectedCategory]}
            </span>
          </button>

          <button
            className="toggle-optional"
            onClick={() => setOptionalFieldsExpanded(!optionalFieldsExpanded)}
          >
            {optionalFieldsExpanded ? tr('lessOptions') : tr('moreOptions')}
          </button>

          {optionalFieldsExpanded && (
            <div className="optional-fields">
              <input
                type="text"
                className="input-field"
                placeholder={tr('store')}
                value={storeInput}
                onChange={(e) => setStoreInput(e.target.value)}
              />
              <textarea
                className="input-field"
                placeholder={tr('notes')}
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
              + Agregar
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
                <span>{tr('category')}</span>
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

      {/* Settings Modal */}
      {settingsModalVisible && (
        <div className="modal-overlay" onClick={() => setSettingsModalVisible(false)}>
          <div className="modal-content settings-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>⚙️ {tr('settings')}</h2>
              <button className="modal-close" onClick={() => setSettingsModalVisible(false)}>
                ✕
              </button>
            </div>

            <h3 className="settings-section-title">{tr('language')}</h3>
            <div className="settings-language-list">
              {Object.keys(languageNames).map((lang) => (
                <button
                  key={lang}
                  className={`settings-language-item ${language === lang ? 'active' : ''}`}
                  onClick={() => updateLanguage(lang)}
                >
                  <span>{languageNames[lang]}</span>
                  {language === lang && <span className="settings-language-check">✓</span>}
                </button>
              ))}
            </div>

            <h3 className="settings-section-title">{tr('darkMode')}</h3>
            <button
              className={`settings-toggle ${isDarkMode ? 'active' : ''}`}
              onClick={() => updateDarkMode(!isDarkMode)}
            >
              {isDarkMode ? '🌙 ON' : '☀️ OFF'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
