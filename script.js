// Fonctions de la maquette.

function listeLangues(){
  const popup = document.getElementById('ajoutLangues');
  if(!popup) return false;

  synchroniserCasesLangues();
  popup.style.display = 'block';
  return false;
}

function hideLangues(){
  const popup = document.getElementById('ajoutLangues');
  if(popup) popup.style.display = 'none';
  synchroniserAffichageLangues();
}

function synchroniserCasesLangues(){
  const input = document.getElementById('langues_exe');
  if(!input) return;

  const codes = input.value
    .split('/')
    .map(code => code.trim())
    .filter(Boolean);

  document.querySelectorAll('input[name="ajout_langue"]').forEach(checkbox => {
    checkbox.checked = codes.includes(checkbox.value);
  });
}

function synchroniserAffichageLangues(){
  const conteneur = document.getElementById('listeLangues');
  const input = document.getElementById('langues_exe');
  if(!conteneur || !input) return;

  const codes = Array.from(conteneur.querySelectorAll('.lang-block'))
    .map(el => el.dataset.code);

  input.value = codes.join(' / ');

  if(typeof majFlagModification === 'function'){
    try { majFlagModification(); } catch(e) {}
  }
}

function modifListeLangues(id){
  const checkbox = document.getElementById(id);
  const conteneur = document.getElementById('listeLangues');
  const input = document.getElementById('langues_exe');

  if(!checkbox || !conteneur || !input) return;

  const code = checkbox.value;
  const blocExistant = conteneur.querySelector('.lang-block[data-code="' + code + '"]');

  if(checkbox.checked && !blocExistant){
    const bloc = document.createElement('span');
    bloc.className = 'lang-block';
    bloc.draggable = true;
    bloc.dataset.code = code;
    bloc.textContent = code;
    conteneur.appendChild(bloc);
  }else if(!checkbox.checked && blocExistant){
    blocExistant.remove();
  }

  synchroniserAffichageLangues();
}

async function copyLanguesExe(){
  const input = document.getElementById('langues_exe');
  if(!input) return;
  const val = input.value;

  try {
    if(navigator.clipboard && window.isSecureContext){
      await navigator.clipboard.writeText(val);
      return;
    }
  } catch(e) {}

  // Fallback utile lorsque la maquette est ouverte directement en fichier local.
  try {
    const textarea = document.createElement('textarea');
    textarea.value = val;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    document.execCommand('copy');
    textarea.remove();
  } catch(e) {}
}

/* Synchronise les interrupteurs avec les langues déjà présentes dans la maquette. */
document.addEventListener('DOMContentLoaded', function(){
  synchroniserCasesLangues();
});

/* --- Drag & Drop des blocs de langues --- */
(function(){
  const conteneur = document.getElementById('listeLangues');
  const inputCache = document.getElementById('langues_exe');
  if(!conteneur) return;

  let elementTraine = null;

  function majOrdreLangues(){
    const codes = Array.from(conteneur.querySelectorAll('.lang-block')).map(el => el.dataset.code);
    if(inputCache) inputCache.value = codes.join(' / ');
    if(typeof majFlagModification === 'function'){ try{ majFlagModification(); }catch(e){} }
  }

  // Anime en douceur le passage de l'ancienne à la nouvelle position (FLIP)
  function flip(reorderFn){
    const avant = new Map();
    conteneur.querySelectorAll('.lang-block').forEach(el => avant.set(el, el.getBoundingClientRect()));

    reorderFn();

    conteneur.querySelectorAll('.lang-block').forEach(el => {
      const b = avant.get(el);
      if(!b) return;
      const a = el.getBoundingClientRect();
      const dx = b.left - a.left;
      if(dx){
        el.style.transition = 'none';
        el.style.transform = `translateX(${dx}px)`;
        requestAnimationFrame(() => {
          el.style.transition = 'transform .22s cubic-bezier(.2,.8,.2,1)';
          el.style.transform = '';
        });
      }
    });
  }

  conteneur.addEventListener('dragstart', function(e){
    const bloc = e.target.closest('.lang-block');
    if(!bloc) return;
    elementTraine = bloc;
    bloc.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', bloc.dataset.code);
  });

  conteneur.addEventListener('dragend', function(e){
    const bloc = e.target.closest('.lang-block');
    if(bloc) bloc.classList.remove('dragging');
    elementTraine = null;
    majOrdreLangues();
  });

  conteneur.addEventListener('dragover', function(e){
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const cible = e.target.closest('.lang-block');
    if(!cible || cible === elementTraine || !elementTraine) return;

    // On se base sur la position de la souris (moitié gauche/droite de la cible)
    // plutôt que sur les index : comparer des index oscille sans arrêt une fois
    // le bloc déplacé juste à côté de la cible (c'est ce qui causait le clignotement).
    const rect = cible.getBoundingClientRect();
    const insererApres = e.clientX > rect.left + rect.width / 2;

    // Si le bloc est déjà au bon endroit, on ne touche à rien (évite le va-et-vient)
    if(insererApres && cible.nextElementSibling === elementTraine) return;
    if(!insererApres && cible.previousElementSibling === elementTraine) return;

    // Réordonne immédiatement dans le DOM mais anime la transition (FLIP)
    flip(() => {
      if(insererApres) cible.after(elementTraine);
      else cible.before(elementTraine);
    });
  });

  conteneur.addEventListener('drop', function(e){
    e.preventDefault();
  });


  // Initialise l'input caché avec l'ordre affiché au chargement de la page.
  majOrdreLangues();
})();
