function fileToDataUrl(file, cb){
  const reader = new FileReader();
  reader.onload = () => cb(reader.result);
  reader.readAsDataURL(file);
}

function filesToDataUrls(files, cb){
  const filesArr = Array.from(files || []);
  if(!filesArr.length){
    cb([]);
    return;
  }

  const dataUrls = [];
  let done = 0;
  filesArr.forEach(file => {
    fileToDataUrl(file, (dataUrl) => {
      dataUrls.push(dataUrl);
      done += 1;
      if(done === filesArr.length){
        cb(dataUrls);
      }
    });
  });
}

/* ---------- HERO PAGE ---------- */
(function heroPage(){
  const addPhotoBtn = document.getElementById('addPhotoBtn');
  const heroPhotoInput = document.getElementById('heroPhotoInput');
  const collageSlot0 = document.getElementById('collageSlot0');
  if(!addPhotoBtn) return;

  function applySavedHeroPhoto(){
    const saved = JSON.parse(localStorage.getItem('cookbook_heroPhotos') || '[]');
    if(saved.length && collageSlot0){
      collageSlot0.innerHTML = `<img src="${saved[0]}" alt="A photo I added">`;
    }
  }
  applySavedHeroPhoto();

  addPhotoBtn.addEventListener('click', () => heroPhotoInput.click());
  heroPhotoInput.addEventListener('change', (e) => {
    const files = e.target.files;
    if(!files || !files.length) return;
    filesToDataUrls(files, (dataUrls) => {
      const existing = JSON.parse(localStorage.getItem('cookbook_heroPhotos') || '[]');
      const merged = [...existing, ...dataUrls].slice(0, 12);
      localStorage.setItem('cookbook_heroPhotos', JSON.stringify(merged));
      applySavedHeroPhoto();
    });
  });
})();

/* ---------- RECIPES PAGE ---------- */
(function recipesPage(){
  const collection = document.getElementById('collection');
  if(!collection) return;

  const featurePhoto = document.getElementById('featurePhoto');
  const featureEmpty = document.getElementById('featureEmpty');
  const featurePhotoGrid = document.getElementById('featurePhotoGrid');
  const featurePhotoInput = document.getElementById('featurePhotoInput');
  const featurePhotoCreate = document.getElementById('featurePhotoCreate');

  const modalOverlay = document.getElementById('modalOverlay');
  const recipeForm = document.getElementById('recipeForm');
  const cancelBtn = document.getElementById('cancelBtn');
  const recipePhotoInput = document.getElementById('recipePhoto');
  const recipePhotoPreview = document.getElementById('recipePhotoPreview');

  const detailOverlay = document.getElementById('detailOverlay');
  const detailModal = document.getElementById('detailModal');

  const featurePreviewOverlay = document.getElementById('featurePreviewOverlay');
  const featurePreviewImage = document.getElementById('featurePreviewImage');
  const featurePreviewClose = document.getElementById('featurePreviewClose');

  const SEED_RECIPES = [];

  /* ---------- feature photo (left side) ---------- */
  function getFeaturePhotos(){
    try{ return JSON.parse(localStorage.getItem('cookbook_featurePhotos') || '[]'); }
    catch(e){ return []; }
  }

  function saveFeaturePhotos(list){
    localStorage.setItem('cookbook_featurePhotos', JSON.stringify(list));
  }

  function applySavedFeaturePhoto(){
    const saved = getFeaturePhotos();
    if(saved.length){
      featureEmpty.style.display = 'none';
      if(featurePhotoGrid){
        featurePhotoGrid.innerHTML = '';
        saved.forEach((url, index) => {
          const tile = document.createElement('div');
          tile.className = 'feature-photo-tile';

          const img = document.createElement('img');
          img.src = url;
          img.alt = 'Snap of what I love ' + (index + 1);

          const removeBtn = document.createElement('button');
          removeBtn.type = 'button';
          removeBtn.className = 'remove-feature-photo';
          removeBtn.setAttribute('aria-label', 'Remove this snap');
          removeBtn.dataset.index = String(index);
          removeBtn.innerHTML = '&times;';

          tile.appendChild(img);
          tile.appendChild(removeBtn);
          featurePhotoGrid.appendChild(tile);
        });
      }
    } else {
      if(featurePhotoGrid){ featurePhotoGrid.innerHTML = ''; }
      featureEmpty.style.display = 'flex';
    }
  }
  applySavedFeaturePhoto();

  featurePhoto.addEventListener('click', (e) => {
    if(e.target.closest('.remove-feature-photo')) return;
    featurePhotoInput.click();
  });

  if(featurePhotoCreate){
    featurePhotoCreate.addEventListener('click', () => featurePhotoInput.click());
  }

  if(featurePhotoGrid){
    featurePhotoGrid.addEventListener('click', (e) => {
      const removeButton = e.target.closest('.remove-feature-photo');
      if(removeButton){
        const photos = getFeaturePhotos();
        const index = Number(removeButton.dataset.index);
        if(Number.isNaN(index)) return;
        photos.splice(index, 1);
        saveFeaturePhotos(photos);
        applySavedFeaturePhoto();
        return;
      }

      const img = e.target.closest('img');
      if(!img) return;
      const photos = getFeaturePhotos();
      const index = Array.from(featurePhotoGrid.children).indexOf(img.closest('.feature-photo-tile'));
      if(index >= 0 && photos[index]) {
        featurePreviewImage.src = photos[index];
        featurePreviewImage.alt = 'Snap of what I love ' + (index + 1);
        if(featurePreviewOverlay) featurePreviewOverlay.classList.add('open');
      }
    });
  }

  featurePhotoInput.addEventListener('change', (e) => {
    const files = e.target.files;
    if(!files || !files.length) return;
    filesToDataUrls(files, (dataUrls) => {
      const existing = getFeaturePhotos();
      const merged = [...existing, ...dataUrls];
      saveFeaturePhotos(merged);
      applySavedFeaturePhoto();
      featurePhotoInput.value = '';
    });
  });

  function renderRecipePreview(files){
    if(!recipePhotoPreview) return;
    if(!files || !files.length){
      recipePhotoPreview.innerHTML = '';
      return;
    }

    recipePhotoPreview.innerHTML = '';
    Array.from(files).forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = () => {
        const row = document.createElement('div');
        row.className = 'recipe-photo-preview-item';
        const img = document.createElement('img');
        img.src = reader.result;
        img.alt = 'Recipe photo preview ' + (index + 1);
        const remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'recipe-photo-remove';
        remove.innerHTML = '&times;';
        remove.dataset.fileName = file.name;
        remove.addEventListener('click', () => {
          const newFiles = Array.from(recipePhotoInput.files || []).filter(f => f.name !== file.name);
          const dt = new DataTransfer();
          newFiles.forEach(f => dt.items.add(f));
          recipePhotoInput.files = dt.files;
          renderRecipePreview(recipePhotoInput.files);
        });
        row.appendChild(img);
        row.appendChild(remove);
        recipePhotoPreview.appendChild(row);
      };
      reader.readAsDataURL(file);
    });
  }

  if(recipePhotoInput){
    recipePhotoInput.addEventListener('change', (e) => {
      renderRecipePreview(e.target.files);
    });
  }

  /* ---------- recipe storage ---------- */
  function getCustomRecipes(){
    try{ return JSON.parse(localStorage.getItem('cookbook_customRecipes') || '[]'); }
    catch(e){ return []; }
  }
  function saveCustomRecipes(list){
    localStorage.setItem('cookbook_customRecipes', JSON.stringify(list));
  }

  function linesToList(text){
    return text.split('\n').map(s => s.trim()).filter(Boolean);
  }

  /* ---------- cards ---------- */
  function buildCard(recipe){
    const firstPhoto = Array.isArray(recipe.photos) ? recipe.photos[0] : recipe.photo;
    const card = document.createElement('article');
    card.className = 'recipe-card';
    card.innerHTML = `
      <div class="thumb">${firstPhoto ? `<img src="${firstPhoto}" alt="${recipe.title}">` : '🍽️'}</div>
      <div class="card-info">
        <p class="card-title">${recipe.title}</p>
        ${recipe.tag ? `<span class="card-tag">${recipe.tag}</span>` : ''}
      </div>
    `;
    card.addEventListener('click', () => openDetail(recipe));
    return card;
  }

  function buildAddCard(){
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'recipe-card add-card';
    card.innerHTML = `
      <span class="add-inner">
        <span class="plus">+</span>
        Add a Recipe
      </span>
    `;
    card.addEventListener('click', openModal);
    return card;
  }

  function renderCards(){
    collection.querySelectorAll('.recipe-card').forEach(el => el.remove());
    const all = [...SEED_RECIPES, ...getCustomRecipes()];
    all.forEach(r => collection.appendChild(buildCard(r)));
    collection.appendChild(buildAddCard());
  }
  renderCards();

  /* ---------- detail view (click a recipe) ---------- */
  function openDetail(recipe){
    const ingredientItems = linesToList(recipe.ingredients || '')
      .map(i => `<li>${i}</li>`).join('');
    const stepItems = linesToList(recipe.steps || '')
      .map(s => `<li>${s}</li>`).join('');
    const isCustom = getCustomRecipes().some(r => r.id === recipe.id);
    const recipePhotos = Array.isArray(recipe.photos) ? recipe.photos : (recipe.photo ? [recipe.photo] : []);
    const photoGallery = recipePhotos.length ? recipePhotos.map((url, index) => `<img class="detail-photo" src="${url}" alt="${recipe.title} ${index + 1}">`).join('') : '';

    detailModal.innerHTML = `
      ${photoGallery}
      <h2>${recipe.title}</h2>
      ${recipe.tag ? `<span class="card-tag">${recipe.tag}</span>` : ''}
      ${ingredientItems ? `<h3>Ingredients</h3><ul>${ingredientItems}</ul>` : ''}
      ${stepItems ? `<h3>Steps</h3><ol>${stepItems}</ol>` : ''}
      <div class="modal-actions">
        <button type="button" class="curved-btn cancel-btn detail-close">Close</button>
        ${isCustom ? `<button type="button" class="curved-btn delete-btn">Delete Recipe</button>` : ''}
      </div>
    `;
    detailModal.querySelector('.detail-close').addEventListener('click', closeDetail);
    if(isCustom){
      detailModal.querySelector('.delete-btn').addEventListener('click', () => deleteRecipe(recipe.id));
    }
    detailOverlay.classList.add('open');
    function deleteRecipe(id){
    const list = getCustomRecipes().filter(r => r.id !== id);
    saveCustomRecipes(list);
    renderCards();
    closeDetail();
  }
  }
  function closeDetail(){
    detailOverlay.classList.remove('open');
  }
  detailOverlay.addEventListener('click', (e) => {
    if(e.target === detailOverlay) closeDetail();
  });

  /* ---------- add-recipe modal ---------- */
  function openModal(){
    modalOverlay.classList.add('open');
    document.getElementById('recipeTitle').focus();
  }
  function closeModal(){
    modalOverlay.classList.remove('open');
    recipeForm.reset();
  }

  cancelBtn.addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', (e) => {
    if(e.target === modalOverlay) closeModal();
  });

  recipeForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = document.getElementById('recipeTitle').value.trim();
    const tag = document.getElementById('recipeOrigin').value.trim();
    const ingredients = document.getElementById('recipeIngredients').value.trim();
    const steps = document.getElementById('recipeSteps').value.trim();
    if(!title) return;

    function finishSave(photoDataUrls){
      const list = getCustomRecipes();
      list.push({ id: Date.now(), title, origin: tag, ingredients, steps, photos: photoDataUrls.length ? photoDataUrls : null, photo: photoDataUrls[0] || null });
      saveCustomRecipes(list);
      renderCards();
      closeModal();
      history.replaceState(null, '', 'recipes.html');
    }

    const files = Array.from(recipePhotoInput.files || []);
    if(files.length){
      filesToDataUrls(files, finishSave);
    } else {
      finishSave([]);
    }
  });

  if(featurePreviewClose){
    featurePreviewClose.addEventListener('click', () => {
      if(featurePreviewOverlay) featurePreviewOverlay.classList.remove('open');
      featurePreviewImage.src = '';
    });
  }

  if(featurePreviewOverlay){
    featurePreviewOverlay.addEventListener('click', (e) => {
      if(e.target === featurePreviewOverlay){
        featurePreviewOverlay.classList.remove('open');
        featurePreviewImage.src = '';
      }
    });
  }

  if(window.location.hash === '#new'){
    openModal();
  }
})();