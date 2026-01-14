const THEME_STORAGE_KEY = 'euoryan_theme';
const AUTO_SAVE_KEY = 'geokml_autosave';
const HISTORY_STORAGE_KEY = 'geokml_history';
const MAX_HISTORY_ITEMS = 20;

const elements = {
  linkInput: document.getElementById('linkInput'),
  nameInput: document.getElementById('nameInput'),
  convertButton: document.getElementById('convertButton'),
  convertButtonText: document.getElementById('convertButtonText'),
  kmlFileInput: document.getElementById('kmlFileInput'),
  convertKmlButton: document.getElementById('convertKmlButton'),
  convertKmlButtonText: document.getElementById('convertKmlButtonText'),
  resultSection: document.getElementById('resultSection'),
  resultInfo: document.getElementById('resultInfo'),
  resultLabel: document.getElementById('resultLabel'),
  downloadButton: document.getElementById('downloadButton'),
  downloadButtonText: document.getElementById('downloadButtonText'),
  copyLinkButton: document.getElementById('copyLinkButton'),
  copyLinkButtonText: document.getElementById('copyLinkButtonText'),
  currentFileInfo: document.getElementById('currentFileInfo'),
  currentFileInfoContent: document.getElementById('currentFileInfoContent'),
  historyList: document.getElementById('historyList'),
  clearButton: document.getElementById('clearButton'),
  privacyToggle: document.getElementById('privacyToggle'),
  resetButton: document.getElementById('resetButton'),
  mobileToggle: document.getElementById('mobileToggle'),
  sidebar: document.getElementById('sidebar')
};

let state = {
  privacyMode: false,
  currentKMLContent: null,
  currentFilename: null,
  currentItem: null,
  currentTab: 'maps-to-kml',
  currentGoogleMapsLink: null
};

// ============================================
// Theme System (Design System)
// ============================================

const themeSwitcher = document.getElementById('themeSwitcher');
const themeDropdownBtn = document.getElementById('themeDropdownBtn');
const themeDropdownContent = document.getElementById('themeDropdownContent');
const themeCurrentIcon = document.getElementById('themeCurrentIcon');
const themeCurrentText = document.getElementById('themeCurrentText');
const themeSystem = document.getElementById('themeSystem');
const themeDark = document.getElementById('themeDark');
const themeLight = document.getElementById('themeLight');
const html = document.documentElement;

const getSystemTheme = () => window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
const applyTheme = (theme) => theme === 'light' ? html.setAttribute('data-theme', 'light') : html.removeAttribute('data-theme');

const iconLight = '<circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>';
const iconDark = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>';

function updateThemeUI(theme) {
  if (!themeSystem || !themeDark || !themeLight) return;
  
  [themeSystem, themeDark, themeLight].forEach(btn => btn.classList.remove('active'));
  if (theme === 'system') {
    themeSystem.classList.add('active');
    if (themeCurrentText) themeCurrentText.textContent = 'Sistema';
    if (themeCurrentIcon) themeCurrentIcon.innerHTML = getSystemTheme() === 'light' ? iconLight : iconDark;
  } else if (theme === 'light') {
    themeLight.classList.add('active');
    if (themeCurrentText) themeCurrentText.textContent = 'Claro';
    if (themeCurrentIcon) themeCurrentIcon.innerHTML = iconLight;
  } else {
    themeDark.classList.add('active');
    if (themeCurrentText) themeCurrentText.textContent = 'Escuro';
    if (themeCurrentIcon) themeCurrentIcon.innerHTML = iconDark;
  }
}

function setTheme(theme) {
  localStorage.setItem(THEME_STORAGE_KEY, theme);
  updateThemeUI(theme);
  applyTheme(theme === 'system' ? getSystemTheme() : theme);
}

function initializeTheme() {
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) || 'system';
  setTheme(savedTheme);

  const mediaQueryLight = window.matchMedia('(prefers-color-scheme: light)');
  const mediaQueryDark = window.matchMedia('(prefers-color-scheme: dark)');
  const handleSystemThemeChange = () => {
    if ((localStorage.getItem(THEME_STORAGE_KEY) || 'system') === 'system') {
      applyTheme(getSystemTheme());
      updateThemeUI('system');
    }
  };
  
  if (mediaQueryLight.addEventListener) {
    mediaQueryLight.addEventListener('change', handleSystemThemeChange);
    mediaQueryDark.addEventListener('change', handleSystemThemeChange);
  } else if (mediaQueryLight.addListener) {
    mediaQueryLight.addListener(handleSystemThemeChange);
    mediaQueryDark.addListener(handleSystemThemeChange);
  }
  
  let lastSystemTheme = getSystemTheme();
  setInterval(() => {
    if ((localStorage.getItem(THEME_STORAGE_KEY) || 'system') === 'system') {
      const current = getSystemTheme();
      if (current !== lastSystemTheme) {
        lastSystemTheme = current;
        handleSystemThemeChange();
      }
    }
  }, 1000);
}

// ============================================
// Privacy System
// ============================================

function togglePrivacyMode() {
  state.privacyMode = !state.privacyMode;
  
  if (elements.privacyToggle) {
    const text = elements.privacyToggle.querySelector('#privacyToggleText');
    if (text) {
      text.textContent = state.privacyMode ? 'Mostrar Dados' : 'Ocultar Dados';
    }
  }
  
  renderHistory();
}

// ============================================
// Reset Page
// ============================================

function resetPage() {
  if (confirm('Tem certeza que deseja descarregar todos os dados? Isso irá limpar todos os dados salvos, resetando a página para o estado padrão.')) {
    localStorage.removeItem(AUTO_SAVE_KEY);
    localStorage.removeItem(HISTORY_STORAGE_KEY);
    window.location.reload();
  }
}

// ============================================
// Auto-save System
// ============================================

function saveFormData() {
  const formData = {
      currentTab: state.currentTab,
      link: elements.linkInput?.value || '',
      name: elements.nameInput?.value || ''
    };
  
  try {
    localStorage.setItem(AUTO_SAVE_KEY, JSON.stringify(formData));
  } catch (error) {
    console.error('Erro ao salvar dados:', error);
  }
}

function loadFormData() {
  try {
    const saved = localStorage.getItem(AUTO_SAVE_KEY);
    if (!saved) return;
    
    const formData = JSON.parse(saved);
    
    if (formData.currentTab) {
      switchTab(formData.currentTab);
    }
    
    if (elements.linkInput && formData.link) {
      elements.linkInput.value = formData.link;
    }
    
      if (elements.nameInput && formData.name) {
        elements.nameInput.value = formData.name;
      }
  } catch (error) {
    console.error('Erro ao carregar dados salvos:', error);
  }
}

function setupAutoSave() {
  if (elements.linkInput) {
    elements.linkInput.addEventListener('input', saveFormData);
  }
  
    if (elements.nameInput) {
      elements.nameInput.addEventListener('input', saveFormData);
    }
}

// ============================================
// History System
// ============================================

function getStoredHistory() {
  try {
    const stored = localStorage.getItem(HISTORY_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    return [];
  }
}

function setStoredHistory(history) {
  localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR', { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatDateForFilename(dateString) {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

function removeDuplicateCoords(coordinates) {
  const seen = new Set();
  const unique = [];
  
  for (const coord of coordinates) {
    const key = `${coord[0].toFixed(6)},${coord[1].toFixed(6)}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(coord);
    }
  }
  
  return unique;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function addToHistory(name, type, data) {
  const history = getStoredHistory();
  
  const createdAt = new Date().toISOString();
  const filenameDate = formatDateForFilename(createdAt);
  const safeName = name.trim() || `${type === 'maps-to-kml' ? 'Rota' : 'Conversão'} ${history.length + 1}`;
  
  const historyItem = {
    id: generateId(),
    name: safeName,
    type: type, // 'maps-to-kml' ou 'kml-to-maps'
    createdAt: createdAt,
    ...data
  };
  
  if (type === 'maps-to-kml') {
    // Usar .kmz se disponível, senão .kml
    const extension = data.useKMZ ? '.kmz' : '.kml';
    historyItem.filename = `${safeName}_${filenameDate}${extension}`;
    historyItem.pointsCount = data.coordinates.length;
    // Salvar estatísticas do processo se disponíveis
    if (data.processStats) {
      historyItem.processStats = data.processStats;
    }
  } else {
    historyItem.googleMapsLink = data.googleMapsLink;
    historyItem.pointsCount = data.coordinates.length;
    if (data.processStats) {
      historyItem.processStats = data.processStats;
    }
  }
  
  history.unshift(historyItem);
  
  if (history.length > MAX_HISTORY_ITEMS) {
    history.splice(MAX_HISTORY_ITEMS);
  }
  
  setStoredHistory(history);
  renderHistory();
  
  return historyItem;
}

function renderHistory() {
  const history = getStoredHistory();
  const historyList = elements.historyList;
  
  if (history.length === 0) {
    historyList.innerHTML = '<div class="history-empty">Nenhuma conversão realizada ainda</div>';
    return;
  }
  
  historyList.innerHTML = '';
  
  history.forEach(item => {
    const historyItem = createHistoryItemElement(item);
    historyList.appendChild(historyItem);
  });
}

function createHistoryItemElement(item) {
  const div = document.createElement('div');
  div.className = 'history-item';
  div.setAttribute('data-history-id', item.id);
  
  const typeLabel = item.type === 'maps-to-kml' ? 'Link→KML' : 'KML→Link';
  const actionButton = item.type === 'maps-to-kml' 
    ? '<button class="btn btn-secondary btn-sm history-download-button" type="button" data-item-id="' + item.id + '" data-action="download" title="Baixar arquivo KML"><svg class="btn-icon" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg><span>Baixar</span></button>'
    : '<button class="btn btn-secondary btn-sm history-download-button" type="button" data-item-id="' + item.id + '" data-action="copy" title="Copiar link do Google Maps"><svg class="btn-icon" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg><span>Copiar</span></button>';
  
  div.innerHTML = `
    <div class="history-item-content">
      <div class="history-item-info">
        <div class="history-item-header">
          <div class="history-name">${escapeHtml(item.name)}</div>
          <div class="history-actions">
            ${actionButton}
            <button class="btn btn-ghost btn-sm history-action-button history-delete-button" title="Excluir item" aria-label="Excluir">
              <svg class="btn-icon" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
        </div>
        
        <div class="history-url-preview">
          ${state.privacyMode ? '***' : `${typeLabel} • ${item.pointsCount} pontos • ${formatDate(item.createdAt)}`}
        </div>
      </div>
    </div>
  `;
  
  addHistoryItemListeners(div, item);
  
  return div;
}

function addHistoryItemListeners(element, item) {
  const actionButton = element.querySelector('.history-download-button');
  
  actionButton.addEventListener('click', (e) => {
    e.stopPropagation();
    const action = actionButton.getAttribute('data-action');
    
    if (action === 'download' && item.type === 'maps-to-kml') {
      downloadFile(item.kmlContent, item.filename);
      const span = actionButton.querySelector('span');
      if (span) span.textContent = 'Baixado!';
      actionButton.classList.add('copied');
      setTimeout(() => {
        if (span) span.textContent = 'Baixar';
        actionButton.classList.remove('copied');
      }, 2000);
    } else if (action === 'copy' && item.type === 'kml-to-maps') {
      copyToClipboard(item.googleMapsLink);
      const span = actionButton.querySelector('span');
      if (span) span.textContent = 'Copiado!';
      actionButton.classList.add('copied');
      setTimeout(() => {
        if (span) span.textContent = 'Copiar';
        actionButton.classList.remove('copied');
      }, 2000);
    }
  });
  
  const deleteButton = element.querySelector('.history-delete-button');
  deleteButton.addEventListener('click', (e) => {
    e.stopPropagation();
    deleteHistoryItem(item.id);
  });
  
  const nameElement = element.querySelector('.history-name');
  nameElement.addEventListener('click', () => {
    showHistoryItemDetails(item);
  });
}

function deleteHistoryItem(id) {
  const history = getStoredHistory();
  const filtered = history.filter(item => item.id !== id);
  setStoredHistory(filtered);
  renderHistory();
}

function clearAllHistory() {
  if (confirm('Tem certeza que deseja limpar todo o histórico?')) {
    setStoredHistory([]);
    renderHistory();
  }
}

function showHistoryItemDetails(item) {
  state.currentItem = item;
  
  const resultSublabel = document.getElementById('resultSublabel');
  
  if (item.type === 'maps-to-kml') {
    state.currentKMLContent = item.kmlContent;
    state.currentFilename = item.filename;
    state.currentGoogleMapsLink = null;
    
    elements.resultLabel.textContent = 'KML do Histórico';
    if (resultSublabel) {
      resultSublabel.textContent = 'Arquivo disponível para download';
    }
    elements.resultInfo.textContent = `${item.name}\n${item.pointsCount} pontos extraídos`;
    elements.downloadButton.style.display = 'inline-flex';
    elements.copyLinkButton.style.display = 'none';
    elements.downloadButtonText.textContent = 'Download';
    elements.downloadButton.classList.remove('success');
  } else {
    state.currentKMLContent = null;
    state.currentFilename = null;
    state.currentGoogleMapsLink = item.googleMapsLink;
    
    elements.resultLabel.textContent = 'Link do Histórico';
    if (resultSublabel) {
      resultSublabel.textContent = 'Link disponível para cópia';
    }
    elements.resultInfo.textContent = `${item.name}\n${item.pointsCount} pontos extraídos`;
    elements.downloadButton.style.display = 'none';
    elements.copyLinkButton.style.display = 'inline-flex';
    elements.copyLinkButtonText.textContent = 'Copiar';
    elements.copyLinkButton.classList.remove('success');
  }
  
  elements.resultSection.style.display = 'flex';
  
  showCurrentFileInfo(item);
  
  elements.resultSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function showCurrentFileInfo(item) {
  if (!item) return;
  
  const lines = [];
  lines.push(`═══════════════════════════════════════════════════════`);
  lines.push(`[INFO] Conversão concluída: ${formatDate(item.createdAt)}`);
  lines.push(`[INFO] Nome da rota: ${item.name}`);
  lines.push(`[INFO] Total de pontos extraídos: ${item.pointsCount}`);
  lines.push('');
  
  // Mostrar estatísticas do processo se disponíveis
  if (item.processStats) {
    lines.push('[PROCESSO] Estatísticas da conversão:');
    if (item.processStats.originalCount !== undefined) {
      lines.push(`  └─ Coordenadas encontradas inicialmente: ${item.processStats.originalCount}`);
    }
    if (item.processStats.duplicatesRemoved !== undefined) {
      lines.push(`  └─ Duplicatas removidas: ${item.processStats.duplicatesRemoved}`);
    }
    if (item.processStats.finalCount !== undefined) {
      lines.push(`  └─ Coordenadas finais: ${item.processStats.finalCount}`);
    }
    if (item.processStats.extractionPhases) {
      lines.push(`  └─ Fases de extração utilizadas: ${item.processStats.extractionPhases.join(', ')}`);
    }
    lines.push('');
  }
  
  if (item.type === 'maps-to-kml') {
    lines.push('[OUTPUT] Arquivo KML gerado:');
    if (item.filename) {
      lines.push(`  └─ Nome do arquivo: ${item.filename}`);
    }
    lines.push(`  └─ Formato: KML (Keyhole Markup Language)`);
    lines.push(`  └─ Tamanho aproximado: ${item.kmlContent ? (item.kmlContent.length / 1024).toFixed(2) + ' KB' : 'N/A'}`);
    lines.push('');
    
    // Mostrar link original se disponível
    if (item.link) {
      lines.push('[INPUT] Link do Google Maps processado:');
      const linkPreview = item.link.length > 80 ? item.link.substring(0, 80) + '...' : item.link;
      lines.push(`  └─ ${linkPreview}`);
      lines.push('');
    }
    
    lines.push('[COORDS] Coordenadas extraídas (ordem da rota):');
    
    if (item.coordinates && item.coordinates.length > 0) {
      // Mostrar mais coordenadas (até 20)
      const maxDisplay = 20;
      item.coordinates.slice(0, maxDisplay).forEach((coord, idx) => {
        lines.push(`  [${String(idx + 1).padStart(3, '0')}] lat: ${coord[0].toFixed(6)}, lng: ${coord[1].toFixed(6)}`);
      });
      
      if (item.coordinates.length > maxDisplay) {
        lines.push(`  ... e mais ${item.coordinates.length - maxDisplay} coordenadas`);
      }
      
      // Mostrar primeira e última coordenada
      if (item.coordinates.length > 1) {
        lines.push('');
        lines.push('[ROTA] Extremos da rota:');
        lines.push(`  └─ Início: lat ${item.coordinates[0][0].toFixed(6)}, lng ${item.coordinates[0][1].toFixed(6)}`);
        lines.push(`  └─ Fim: lat ${item.coordinates[item.coordinates.length - 1][0].toFixed(6)}, lng ${item.coordinates[item.coordinates.length - 1][1].toFixed(6)}`);
      }
    } else {
      lines.push('  └─ Nenhuma coordenada encontrada');
    }
  } else {
    lines.push('[OUTPUT] Link do Google Maps gerado:');
    lines.push(`  └─ Tipo: Google Maps Directions`);
    lines.push(`  └─ Método: ${item.processStats?.method || 'waypoints-optimized'}`);
    lines.push(`  └─ Waypoints utilizados: ${item.coordinates ? item.coordinates.length : 0}`);
    
    // Mostrar informações de simplificação se houver
    if (item.processStats && item.processStats.wasSimplified) {
      lines.push('');
      lines.push('[SIMPLIFICAÇÃO] Rota otimizada automaticamente:');
      lines.push(`  └─ Algoritmo: ${item.processStats.simplificationMethod || 'Douglas-Peucker'}`);
      lines.push(`  └─ Pontos originais: ${item.processStats.originalCount || item.originalCoordinates?.length || 'N/A'}`);
      lines.push(`  └─ Waypoints finais: ${item.processStats.finalCount || item.coordinates.length}`);
      lines.push(`  └─ Pontos removidos: ${item.processStats.pointsRemoved || 0}`);
      lines.push(`  └─ Redução: ${item.processStats.originalCount ? ((item.processStats.pointsRemoved / item.processStats.originalCount) * 100).toFixed(1) : 0}%`);
      lines.push('');
      lines.push('[NOTA] Simplificação mantém a forma da rota removendo pontos');
      lines.push('       redundantes e mantendo apenas curvas importantes.');
    } else {
      lines.push('');
      lines.push('[FORMATO] Link otimizado usando waypoints ordenados:');
      lines.push('  └─ Formato: origin → waypoint1|waypoint2|... → destination');
      lines.push('  └─ Garante que a rota passe pelos pontos na ordem exata');
      lines.push('  └─ Waypoints intermediários mantêm a sequência da rota');
    }
    
    if (item.googleMapsLink) {
      lines.push('');
      lines.push('[LINK] Link do Google Maps:');
      const linkPreview = item.googleMapsLink.length > 100 ? item.googleMapsLink.substring(0, 100) + '...' : item.googleMapsLink;
      lines.push(`  └─ ${linkPreview}`);
    }
    
    lines.push('');
    lines.push('[COORDS] Waypoints da rota (ordem):');
    
    if (item.coordinates && item.coordinates.length > 0) {
      const maxDisplay = 25; // Mostrar todos se for até 25
      item.coordinates.slice(0, maxDisplay).forEach((coord, idx) => {
        const label = idx === 0 ? 'INÍCIO' : (idx === item.coordinates.length - 1 ? 'FIM' : `WPT-${idx}`);
        lines.push(`  [${String(idx + 1).padStart(3, '0')}] ${label.padEnd(10)} lat: ${coord[0].toFixed(6)}, lng: ${coord[1].toFixed(6)}`);
      });
      
      if (item.coordinates.length > maxDisplay) {
        lines.push(`  ... e mais ${item.coordinates.length - maxDisplay} waypoints`);
      }
    } else {
      lines.push('  └─ Nenhuma coordenada encontrada');
    }
  }
  
  lines.push(`═══════════════════════════════════════════════════════`);
  
  elements.currentFileInfoContent.textContent = lines.join('\n');
  elements.currentFileInfo.style.display = 'block';
}

// ============================================
// KML Converter Logic
// ============================================

function extractCoordinatesFromUrl(url) {
  const orderedCoords = []; // Coordenadas na ordem correta
  const coordSet = new Set(); // Para evitar duplicatas exatas
  
  let decodedUrl = url;
  // Decodificar URL múltiplas vezes se necessário
  try {
    decodedUrl = decodeURIComponent(url);
    if (decodedUrl.includes('%')) {
      try {
        decodedUrl = decodeURIComponent(decodedUrl);
      } catch (e2) {
        // Se falhar na segunda tentativa, usar o resultado da primeira
      }
    }
  } catch (e) {
    decodedUrl = url;
  }
  
  // ESTRATÉGIA: Extrair TODAS as coordenadas do 'data' e também de toda a URL
  // O parâmetro 'data' contém as coordenadas na ordem correta da rota
  
  // FASE 1: Extrair TODAS as coordenadas do 'data' na ordem que aparecem
  const dataMatch = decodedUrl.match(/[?&]data=([^&]+)/);
  const dataCoords = [];
  
  if (dataMatch) {
    try {
      const dataParam = dataMatch[1];
      
      // Padrão 1: !2m2!1d[lng]!2d[lat] (formato mais comum em rotas com múltiplos pontos)
      // Padrão 2: !1d[lng]!2d[lat] (formato alternativo)
      // IMPORTANTE: No formato !1d[lng]!2d[lat], o primeiro é longitude e o segundo é latitude
      const pattern1 = /!2m2!1d(-?\d+\.?\d*)!2d(-?\d+\.?\d*)/g;
      const pattern2 = /!1d(-?\d+\.?\d*)!2d(-?\d+\.?\d*)/g;
      
      // Capturar TODOS os matches de ambos os padrões usando matchAll
      const matches1 = [...dataParam.matchAll(pattern1)];
      const matches2 = [...dataParam.matchAll(pattern2)];
      
      // Combinar todos os matches com suas posições
      const allMatches = [];
      
      for (const match of matches1) {
        allMatches.push({
          match: match,
          position: match.index,
          pattern: 1
        });
      }
      
      for (const match of matches2) {
        // Evitar duplicatas do pattern1
        const isDuplicate = matches1.some(m1 => 
          m1.index === match.index && m1[0] === match[0]
        );
        if (!isDuplicate) {
          allMatches.push({
            match: match,
            position: match.index,
            pattern: 2
          });
        }
      }
      
      // Ordenar matches pela posição na string para manter a ordem exata
      allMatches.sort((a, b) => a.position - b.position);
      
      // Processar matches na ordem, evitando duplicatas
      const seen = new Set();
      for (const item of allMatches) {
        const match = item.match;
        const lng = parseFloat(match[1]);
        const lat = parseFloat(match[2]);
        
        if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
          const key = `${lat.toFixed(6)},${lng.toFixed(6)}`;
          if (!seen.has(key)) {
            seen.add(key);
            dataCoords.push([lat, lng]);
          }
        }
      }
    } catch (e) {
      console.warn('Erro ao processar data:', e);
    }
  }
  
  // FASE 2: Se encontramos coordenadas no data, usar elas diretamente na ordem
  if (dataCoords.length > 0) {
    for (const coord of dataCoords) {
      const key = `${coord[0].toFixed(6)},${coord[1].toFixed(6)}`;
      if (!coordSet.has(key)) {
        coordSet.add(key);
        orderedCoords.push(coord);
      }
    }
  }
  
  // FASE 3: Se ainda não temos coordenadas suficientes, buscar em toda a URL
  // Isso captura coordenadas que podem estar fora do parâmetro data=
  if (orderedCoords.length === 0 || orderedCoords.length < 2) {
    const urlPattern1 = /!2m2!1d(-?\d+\.?\d*)!2d(-?\d+\.?\d*)/g;
    const urlPattern2 = /!1d(-?\d+\.?\d*)!2d(-?\d+\.?\d*)/g;
    const urlMatches1 = [...decodedUrl.matchAll(urlPattern1)];
    const urlMatches2 = [...decodedUrl.matchAll(urlPattern2)];
    
    // Combinar matches de toda a URL
    const allUrlMatches = [];
    
    for (const match of urlMatches1) {
      allUrlMatches.push({
        match: match,
        position: match.index
      });
    }
    
    for (const match of urlMatches2) {
      // Evitar duplicatas
      const isDuplicate = urlMatches1.some(m1 => 
        m1.index === match.index && m1[0] === match[0]
      );
      if (!isDuplicate) {
        allUrlMatches.push({
          match: match,
          position: match.index
        });
      }
    }
    
    // Ordenar por posição
    allUrlMatches.sort((a, b) => a.position - b.position);
    
    // Adicionar coordenadas que ainda não foram adicionadas
    for (const item of allUrlMatches) {
      const match = item.match;
      const lng = parseFloat(match[1]);
      const lat = parseFloat(match[2]);
      
      if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        const key = `${lat.toFixed(6)},${lng.toFixed(6)}`;
        if (!coordSet.has(key)) {
          coordSet.add(key);
          orderedCoords.push([lat, lng]);
        }
      }
    }
  }
  
  // FASE 4: Fallback - tentar extrair do /dir/ se ainda não temos coordenadas
  if (orderedCoords.length === 0) {
    const dirMatch = decodedUrl.match(/\/dir\/(.*?)(?:\/@|\/data=|\?|$)/);
    
    if (dirMatch) {
      const routeSection = dirMatch[1];
      const items = routeSection.split('/');
      
      for (let item of items) {
        item = item.trim();
        if (!item) continue;
        
        // Tentar extrair coordenada direta
        const cleanItem = item.split(/[+@\s]/)[0].trim();
        const coordMatch = cleanItem.match(/^(-?\d+\.?\d*),(-?\d+\.?\d*)$/);
        
        if (coordMatch) {
          const lat = parseFloat(coordMatch[1]);
          const lng = parseFloat(coordMatch[2]);
          
          if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
            const key = `${lat.toFixed(6)},${lng.toFixed(6)}`;
            if (!coordSet.has(key)) {
              coordSet.add(key);
              orderedCoords.push([lat, lng]);
            }
          }
        }
      }
    }
  }
  
  return orderedCoords;
}

function createKML(coordinates, name) {
  let kml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  kml += '<kml xmlns="http://www.opengis.net/kml/2.2">\n';
  kml += '  <Document>\n';
  kml += `    <name>${escapeHtml(name)}</name>\n`;
  kml += `    <description>Rota convertida do Google Maps com ${coordinates.length} pontos</description>\n`;
  
  kml += '    <Placemark>\n';
  kml += '      <name>Rota</name>\n';
  kml += '      <LineString>\n';
  kml += '        <tessellate>1</tessellate>\n';
  kml += '        <coordinates>';
  kml += coordinates.map(coord => `${coord[1]},${coord[0]},0`).join(' ');
  kml += '</coordinates>\n';
  kml += '      </LineString>\n';
  kml += '    </Placemark>\n';
  
  coordinates.forEach((coord, index) => {
    kml += '    <Placemark>\n';
    kml += `      <name>Ponto ${index + 1}</name>\n`;
    kml += '      <Point>\n';
    kml += `        <coordinates>${coord[1]},${coord[0]},0</coordinates>\n`;
    kml += '      </Point>\n';
    kml += '    </Placemark>\n';
  });
  
  kml += '  </Document>\n';
  kml += '</kml>';
  
  return kml;
}

function downloadFile(content, filename) {
  const blob = new Blob([content], { type: 'application/vnd.google-earth.kml+xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

async function downloadKMZ(kmlContent, filename) {
  // KMZ é um arquivo ZIP contendo o KML
  // Como não temos JSZip disponível, vamos criar um ZIP básico usando a API do navegador
  try {
    // Tentar usar JSZip se disponível via CDN
    if (typeof JSZip !== 'undefined') {
      const zip = new JSZip();
      const kmlFileName = filename.replace(/\.kmz$/i, '.kml');
      zip.file(kmlFileName, kmlContent);
      const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename.endsWith('.kmz') ? filename : filename.replace(/\.kml$/i, '.kmz');
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return true;
    }
  } catch (e) {
    console.warn('JSZip não disponível, usando KML:', e);
  }
  
  // Fallback: usar KML se KMZ não estiver disponível
  downloadFile(kmlContent, filename.replace(/\.kmz$/i, '.kml'));
  return false;
}

async function convertToKML() {
  const link = elements.linkInput.value.trim();
  
  if (!link) {
    alert('Por favor, cole um link do Google Maps.');
    return;
  }
  
  if (link.includes('goo.gl') || link.includes('maps.app.goo.gl')) {
    alert('Links encurtados não funcionam no navegador devido a restrições de segurança.\n\nUse o link completo copiado da barra de endereço do Google Maps.');
    return;
  }
  
  elements.convertButton.classList.add('loading');
  elements.convertButton.disabled = true;
  const spinner = elements.convertButton.querySelector('#convertSpinner');
  const icon = elements.convertButton.querySelector('#convertIcon');
  if (spinner) spinner.style.display = 'block';
  if (icon) icon.style.display = 'none';
  
  try {
    const coordinates = extractCoordinatesFromUrl(link);
    const originalCount = coordinates.length;
    
    if (coordinates.length === 0) {
      throw new Error('Não foi possível extrair coordenadas do link. Verifique se o link contém uma rota válida.');
    }
    
    // Remover apenas coordenadas duplicadas consecutivas mantendo a ordem original
    const uniqueCoords = [];
    for (let i = 0; i < coordinates.length; i++) {
      const coord = coordinates[i];
      const prevCoord = uniqueCoords[uniqueCoords.length - 1];
      
      // Adicionar se for o primeiro ou se for diferente da anterior
      if (!prevCoord || 
          Math.abs(coord[0] - prevCoord[0]) > 0.000001 || 
          Math.abs(coord[1] - prevCoord[1]) > 0.000001) {
        uniqueCoords.push(coord);
      }
    }
    
    const finalCoordinates = uniqueCoords.length > 0 ? uniqueCoords : coordinates;
    const duplicatesRemoved = originalCount - finalCoordinates.length;
    
    const name = elements.nameInput.value.trim() || `Rota ${getStoredHistory().length + 1}`;
    
    const kmlContent = createKML(finalCoordinates, name);
    
    // Criar estatísticas do processo
    const processStats = {
      originalCount: originalCount,
      duplicatesRemoved: duplicatesRemoved,
      finalCount: finalCoordinates.length,
      extractionPhases: originalCount > 0 ? ['FASE 1', originalCount > 1 ? 'FASE 1.5' : null, 'FASE 2', 'FASE 3'].filter(Boolean) : []
    };
    
    const historyItem = addToHistory(name, 'maps-to-kml', {
      kmlContent: kmlContent,
      coordinates: finalCoordinates,
      link: link,
      processStats: processStats
    });
    
    state.currentKMLContent = kmlContent;
    state.currentFilename = historyItem.filename;
    state.currentItem = historyItem;
    
    // Mostrar resultado
    const resultSublabel = document.getElementById('resultSublabel');
    elements.resultLabel.textContent = 'KML Gerado com Sucesso';
    if (resultSublabel) {
      resultSublabel.textContent = 'Arquivo pronto para download';
    }
    elements.resultInfo.textContent = `${name}\n${finalCoordinates.length} pontos extraídos`;
    elements.resultSection.style.display = 'flex';
    
    elements.downloadButton.style.display = 'inline-flex';
    elements.copyLinkButton.style.display = 'none';
    
    showCurrentFileInfo(historyItem);
    
    // Fazer download automático
    downloadFile(kmlContent, historyItem.filename);
    elements.downloadButtonText.textContent = 'Baixando...';
    elements.downloadButton.classList.add('success');
    
    setTimeout(() => {
      elements.downloadButtonText.textContent = 'Download';
      elements.downloadButton.classList.remove('success');
    }, 2500);
    
    elements.resultSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    
  } catch (error) {
    alert(`Erro durante a conversão: ${error.message}`);
    console.error(error);
  } finally {
    elements.convertButton.classList.remove('loading');
    elements.convertButton.disabled = false;
    const spinner = elements.convertButton.querySelector('#convertSpinner');
    const icon = elements.convertButton.querySelector('#convertIcon');
    if (spinner) spinner.style.display = 'none';
    if (icon) icon.style.display = 'block';
  }
}

function handleDownload() {
  if (!state.currentKMLContent || !state.currentFilename) {
    alert('Nenhum arquivo KML disponível.');
    return;
  }
  
  downloadFile(state.currentKMLContent, state.currentFilename);
  
  elements.downloadButtonText.textContent = 'Baixando...';
  elements.downloadButton.classList.add('copied');
  
  setTimeout(() => {
    elements.downloadButtonText.textContent = 'Download';
    elements.downloadButton.classList.remove('copied');
  }, 2000);
}

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    // Fallback para navegadores mais antigos
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return true;
    } catch (e) {
      document.body.removeChild(textArea);
      return false;
    }
  }
}

function handleCopyLink() {
  if (!state.currentGoogleMapsLink) {
    alert('Nenhum link do Google Maps disponível.');
    return;
  }
  
  copyToClipboard(state.currentGoogleMapsLink);
  
  elements.copyLinkButtonText.textContent = 'Copiado!';
  elements.copyLinkButton.classList.add('copied');
  
  setTimeout(() => {
    elements.copyLinkButtonText.textContent = 'Copiar';
    elements.copyLinkButton.classList.remove('copied');
  }, 2000);
}

// ============================================
// Tabs System
// ============================================

function switchTab(tabId) {
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabContents = document.querySelectorAll('.tab-content');
  const tabsDropdown = document.getElementById('tabsDropdown');
  
  tabButtons.forEach(btn => btn.classList.remove('active'));
  tabContents.forEach(content => content.classList.remove('active'));
  
  const selectedButton = document.querySelector(`[data-tab="${tabId}"]`);
  if (selectedButton) {
    selectedButton.classList.add('active');
  }
  
  const selectedContent = document.getElementById(`tab-${tabId}`);
  if (selectedContent) {
    selectedContent.classList.add('active');
  }
  
  if (tabsDropdown) {
    tabsDropdown.value = tabId;
  }
  
  state.currentTab = tabId;
  
    elements.resultSection.style.display = 'none';
    elements.currentFileInfo.style.display = 'none';
  
  saveFormData();
}

function initTabs() {
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabsDropdown = document.getElementById('tabsDropdown');
  
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const tabId = button.getAttribute('data-tab');
      switchTab(tabId);
    });
  });
  
  if (tabsDropdown) {
    tabsDropdown.addEventListener('change', (e) => {
      switchTab(e.target.value);
    });
    
    const activeTab = document.querySelector('.tab-button.active');
    if (activeTab) {
      tabsDropdown.value = activeTab.getAttribute('data-tab');
    }
  }
}

// ============================================
// KML → Maps Converter Logic
// ============================================

function parseKMLFile(kmlText) {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(kmlText, 'text/xml');
  
  const coordinates = [];
  
  // ESTRATÉGIA SIMPLES E EFETIVA:
  // 1. Extrair APENAS os Stops ordenados (1-18)
  // 2. Route start e Route end são apenas marcadores, não waypoints reais
  // 3. O primeiro Stop já é o início e o último Stop já é o fim
  // 4. Isso garante exatamente 18 pontos na ordem correta
  
  const placemarks = xmlDoc.getElementsByTagName('Placemark');
  const stopsArray = [];
  
  for (let placemark of placemarks) {
    const nameElement = placemark.getElementsByTagName('name')[0];
    const pointElement = placemark.getElementsByTagName('Point')[0];
    
    if (pointElement && nameElement) {
      const coordElements = pointElement.getElementsByTagName('coordinates');
      
      if (coordElements.length > 0) {
        const coordText = coordElements[0].textContent.trim();
        const parts = coordText.split(',');
        
        if (parts.length >= 2) {
          const lng = parseFloat(parts[0]);
          const lat = parseFloat(parts[1]);
          
          if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
            const name = nameElement.textContent.trim();
            
            // Extrair número do Stop - IGNORAR Route start/end (são apenas marcadores)
            const stopMatch = name.match(/Stop\s*\((\d+)\)/i);
            
            if (stopMatch) {
              const order = parseInt(stopMatch[1]);
              
              stopsArray.push({
                name: name,
                lat: lat,
                lng: lng,
                order: order
              });
            }
          }
        }
      }
    }
  }
  
  // Se encontrou Stops, ordenar e adicionar TODOS na ordem
  if (stopsArray.length > 0) {
    // Ordenar por número do Stop (1, 2, 3, ..., 18)
    stopsArray.sort((a, b) => a.order - b.order);
    
    // Adicionar TODOS os Stops na ordem exata
    for (let stop of stopsArray) {
      coordinates.push([stop.lat, stop.lng]);
    }
  } else {
    // Fallback: Se não encontrou Stops, tentar LineString
    const lineStrings = xmlDoc.getElementsByTagName('LineString');
    const coordSet = new Set();
    
    if (lineStrings.length > 0) {
      for (let lineString of lineStrings) {
        const coordElements = lineString.getElementsByTagName('coordinates');
        if (coordElements.length > 0) {
          const coordText = coordElements[0].textContent.trim();
          const coordPairs = coordText.split(/\s+/);
          for (let pair of coordPairs) {
            const parts = pair.split(',');
            if (parts.length >= 2) {
              const lng = parseFloat(parts[0]);
              const lat = parseFloat(parts[1]);
              if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
                const key = `${lat.toFixed(6)},${lng.toFixed(6)}`;
                if (!coordSet.has(key)) {
                  coordSet.add(key);
                  coordinates.push([lat, lng]);
                }
              }
            }
          }
        }
      }
    }
  }
  
  return coordinates;
}

// ============================================
// Algoritmo de Simplificação de Rota (Douglas-Peucker)
// ============================================

/**
 * Calcula a distância perpendicular de um ponto a uma linha
 * @param {Array} point - [lat, lng]
 * @param {Array} lineStart - [lat, lng]
 * @param {Array} lineEnd - [lat, lng]
 * @returns {number} - Distância em graus
 */
function perpendicularDistance(point, lineStart, lineEnd) {
  const [lat, lng] = point;
  const [lat1, lng1] = lineStart;
  const [lat2, lng2] = lineEnd;
  
  // Converter para radianos
  const toRad = (deg) => deg * Math.PI / 180;
  
  // Usar fórmula de distância haversine simplificada
  const dx = lng2 - lng1;
  const dy = lat2 - lat1;
  
  if (dx === 0 && dy === 0) {
    // Linha degenerada (início = fim)
    return Math.sqrt(Math.pow(lat - lat1, 2) + Math.pow(lng - lng1, 2));
  }
  
  // Distância perpendicular usando álgebra vetorial
  const t = ((lat - lat1) * dy + (lng - lng1) * dx) / (dx * dx + dy * dy);
  
  let closestLat, closestLng;
  if (t < 0) {
    closestLat = lat1;
    closestLng = lng1;
  } else if (t > 1) {
    closestLat = lat2;
    closestLng = lng2;
  } else {
    closestLat = lat1 + t * dy;
    closestLng = lng1 + t * dx;
  }
  
  return Math.sqrt(Math.pow(lat - closestLat, 2) + Math.pow(lng - closestLng, 2));
}

/**
 * Algoritmo Douglas-Peucker para simplificar polilinha
 * @param {Array} points - Array de [lat, lng]
 * @param {number} epsilon - Tolerância (quanto menor, mais pontos mantém)
 * @returns {Array} - Array simplificado de pontos
 */
function douglasPeucker(points, epsilon) {
  if (points.length <= 2) {
    return points;
  }
  
  let maxDistance = 0;
  let maxIndex = 0;
  const end = points.length - 1;
  
  // Encontrar o ponto com maior distância perpendicular
  for (let i = 1; i < end; i++) {
    const distance = perpendicularDistance(points[i], points[0], points[end]);
    if (distance > maxDistance) {
      maxDistance = distance;
      maxIndex = i;
    }
  }
  
  // Se a distância máxima é maior que epsilon, dividir recursivamente
  if (maxDistance > epsilon) {
    const left = douglasPeucker(points.slice(0, maxIndex + 1), epsilon);
    const right = douglasPeucker(points.slice(maxIndex), epsilon);
    
    // Combinar resultados (removendo duplicata no meio)
    return left.slice(0, -1).concat(right);
  } else {
    // Todos os pontos intermediários estão próximos à linha
    return [points[0], points[end]];
  }
}

/**
 * Simplifica rota mantendo no máximo maxPoints pontos
 * @param {Array} coordinates - Array de [lat, lng]
 * @param {number} maxPoints - Máximo de pontos desejados
 * @returns {Object} - {simplified: Array, stats: Object}
 */
function simplifyRoute(coordinates, maxPoints = 25) {
  if (coordinates.length <= maxPoints) {
    return {
      simplified: coordinates,
      stats: {
        originalCount: coordinates.length,
        simplifiedCount: coordinates.length,
        pointsRemoved: 0,
        epsilon: 0,
        wasSimplified: false
      }
    };
  }
  
  // Começar com epsilon pequeno e aumentar até atingir o limite
  let epsilon = 0.0001; // ~11 metros
  let simplified = coordinates;
  let iterations = 0;
  const maxIterations = 20;
  
  while (simplified.length > maxPoints && iterations < maxIterations) {
    simplified = douglasPeucker(coordinates, epsilon);
    epsilon *= 1.5; // Aumentar tolerância progressivamente
    iterations++;
  }
  
  return {
    simplified: simplified,
    stats: {
      originalCount: coordinates.length,
      simplifiedCount: simplified.length,
      pointsRemoved: coordinates.length - simplified.length,
      epsilon: epsilon,
      wasSimplified: true
    }
  };
}

/**
 * Cria link do Google Maps otimizado usando formato de waypoints
 * @param {Array} coordinates - Array de [lat, lng]
 * @param {Object} options - Opções de configuração
 * @returns {Object} - {link, coordinates, simplificationStats, method}
 */
function createGoogleMapsLink(coordinates, options = {}) {
  if (coordinates.length === 0) return null;
  
  const maxWaypoints = options.maxWaypoints || 25;
  
  // IMPORTANTE: As coordenadas já vêm do parseKMLFile sem duplicatas consecutivas
  // Então não precisamos remover duplicatas aqui novamente
  // Isso garante que todos os pontos sejam mantidos
  
  let finalCoords = coordinates; // Usar coordenadas diretamente, sem filtro adicional
  let simplificationStats = null;
  let method = 'direct';
  
  // SEGUNDO: Se tiver muitas coordenadas, simplificar
  // Mas só se realmente necessário (mais de 25 waypoints)
  // IMPORTANTE: 18 pontos < 25, então NÃO deve simplificar!
  if (finalCoords.length > maxWaypoints) {
    const result = simplifyRoute(finalCoords, maxWaypoints);
    finalCoords = result.simplified;
    simplificationStats = result.stats;
  }
  
  let link;
  
  if (finalCoords.length <= 2) {
    // Apenas origem e destino
    const origin = finalCoords[0];
    const destination = finalCoords[finalCoords.length - 1];
    link = `https://www.google.com/maps/dir/?api=1&origin=${origin[0]},${origin[1]}&destination=${destination[0]},${destination[1]}&travelmode=driving`;
    method = 'origin-destination';
  } else {
    // Origem, destino e waypoints intermediários
    const origin = finalCoords[0];
    const destination = finalCoords[finalCoords.length - 1];
    const waypoints = finalCoords.slice(1, -1);
    
    // Google Maps aceita formato simples: lat,lng|lat,lng
    // Formato oficial que mantém a ordem exata dos waypoints
    const waypointsString = waypoints.map(coord => `${coord[0]},${coord[1]}`).join('|');
    
    link = `https://www.google.com/maps/dir/?api=1&origin=${origin[0]},${origin[1]}&destination=${destination[0]},${destination[1]}&waypoints=${waypointsString}&travelmode=driving`;
    method = 'waypoints-ordered';
  }
  
  return {
    link: link,
    coordinates: finalCoords,
    simplificationStats: simplificationStats,
    method: method
  };
}

async function convertKMLToMaps() {
  const fileInput = elements.kmlFileInput;
  
  if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
    alert('Por favor, selecione um arquivo KML.');
    return;
  }
  
  const file = fileInput.files[0];
  
  elements.convertKmlButton.classList.add('loading');
  elements.convertKmlButton.disabled = true;
  const spinner = elements.convertKmlButton.querySelector('#convertKmlSpinner');
  const icon = elements.convertKmlButton.querySelector('#convertKmlIcon');
  if (spinner) spinner.style.display = 'block';
  if (icon) icon.style.display = 'none';
  
  try {
    const fileText = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsText(file);
    });
    
    const coordinates = parseKMLFile(fileText);
    
    if (coordinates.length === 0) {
      throw new Error('Não foi possível extrair coordenadas do arquivo KML. Verifique se o arquivo contém coordenadas válidas.');
    }
    
    const linkResult = createGoogleMapsLink(coordinates);
    
    if (!linkResult || !linkResult.link) {
      throw new Error('Não foi possível gerar o link do Google Maps.');
    }
    
    const name = file.name.replace(/\.kml$/i, '') || `Conversão ${getStoredHistory().length + 1}`;
    
    // Criar estatísticas do processo
    const processStats = {
      originalCount: coordinates.length,
      finalCount: linkResult.coordinates.length,
      wasSimplified: linkResult.simplificationStats ? linkResult.simplificationStats.wasSimplified : false,
      pointsRemoved: linkResult.simplificationStats ? linkResult.simplificationStats.pointsRemoved : (coordinates.length - linkResult.coordinates.length),
      simplificationMethod: linkResult.simplificationStats ? 'Douglas-Peucker' : 'Waypoints otimizados',
      method: linkResult.method || 'unknown',
      apiUsed: false
    };
    
    const historyItem = addToHistory(name, 'kml-to-maps', {
      googleMapsLink: linkResult.link,
      coordinates: linkResult.coordinates,
      originalCoordinates: coordinates,
      processStats: processStats
    });
    
    state.currentKMLContent = null;
    state.currentFilename = null;
    state.currentGoogleMapsLink = linkResult.link;
    state.currentItem = historyItem;
    
    const resultSublabel = document.getElementById('resultSublabel');
    elements.resultLabel.textContent = 'Link Gerado com Sucesso';
    if (resultSublabel) {
      if (linkResult.simplificationStats && linkResult.simplificationStats.wasSimplified) {
        resultSublabel.textContent = `Rota simplificada: ${linkResult.coordinates.length} waypoints de ${coordinates.length} pontos`;
      } else {
        resultSublabel.textContent = `Rota otimizada com ${linkResult.coordinates.length} waypoints`;
      }
    }
    
    let infoText = `${name}\n${linkResult.coordinates.length} waypoints`;
    if (linkResult.simplificationStats && linkResult.simplificationStats.wasSimplified) {
      infoText += `\n(simplificado de ${coordinates.length} pontos)`;
    }
    elements.resultInfo.textContent = infoText;
    elements.resultSection.style.display = 'flex';
    
    elements.downloadButton.style.display = 'none';
    elements.copyLinkButton.style.display = 'inline-flex';
    
    showCurrentFileInfo(historyItem);
    
    // Copiar link automaticamente
    navigator.clipboard.writeText(linkResult.link).then(() => {
      elements.copyLinkButtonText.textContent = 'Copiado!';
      elements.copyLinkButton.classList.add('success');
      
      setTimeout(() => {
        elements.copyLinkButtonText.textContent = 'Copiar';
        elements.copyLinkButton.classList.remove('success');
      }, 2500);
    }).catch(err => {
      console.error('Erro ao copiar:', err);
    });
    
    elements.resultSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    
  } catch (error) {
    alert(`Erro durante a conversão: ${error.message}`);
    console.error(error);
  } finally {
    elements.convertKmlButton.classList.remove('loading');
    elements.convertKmlButton.disabled = false;
    const spinner = elements.convertKmlButton.querySelector('#convertKmlSpinner');
    const icon = elements.convertKmlButton.querySelector('#convertKmlIcon');
    if (spinner) spinner.style.display = 'none';
    if (icon) icon.style.display = 'block';
  }
}

// ============================================
// Event Listeners
// ============================================

function addEventListeners() {
  // Theme Switcher
  if (themeDropdownBtn) {
    themeDropdownBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (themeSwitcher) themeSwitcher.classList.toggle('open');
    });
  }

  document.addEventListener('click', (e) => {
    if (themeSwitcher && !themeSwitcher.contains(e.target)) {
      themeSwitcher.classList.remove('open');
    }
    if (window.innerWidth <= 768 && elements.sidebar && !elements.sidebar.contains(e.target) && elements.mobileToggle && !elements.mobileToggle.contains(e.target)) {
      elements.sidebar.classList.remove('open');
    }
  });
  
  if (themeSystem && themeDark && themeLight) {
    [themeSystem, themeDark, themeLight].forEach((btn, i) => {
      btn.addEventListener('click', () => {
        setTheme(['system', 'dark', 'light'][i]);
        if (themeSwitcher) themeSwitcher.classList.remove('open');
      });
    });
  }
  
  // Mobile Toggle
  if (elements.mobileToggle) {
    elements.mobileToggle.addEventListener('click', () => {
      if (elements.sidebar) elements.sidebar.classList.toggle('open');
    });
  }
  
  if (elements.resetButton) {
    elements.resetButton.addEventListener('click', resetPage);
  }
  
  if (elements.privacyToggle) {
    elements.privacyToggle.addEventListener('click', togglePrivacyMode);
  }
  
  if (elements.convertButton) {
    elements.convertButton.addEventListener('click', convertToKML);
  }
  
  if (elements.convertKmlButton) {
    elements.convertKmlButton.addEventListener('click', convertKMLToMaps);
  }
  
  if (elements.downloadButton) {
    elements.downloadButton.addEventListener('click', handleDownload);
  }
  
  if (elements.copyLinkButton) {
    elements.copyLinkButton.addEventListener('click', handleCopyLink);
  }
  
  if (elements.clearButton) {
    elements.clearButton.addEventListener('click', clearAllHistory);
  }
  
  if (elements.linkInput) {
    elements.linkInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        convertToKML();
      }
    });
  }
  
  initTabs();
}

// ============================================
// Initialize
// ============================================

function initialize() {
  initializeTheme();
  addEventListeners();
  setupAutoSave();
  loadFormData();
  renderHistory();
  
  // Navigation - apenas scroll para converter
  const navItems = document.querySelectorAll('.nav-item[href^="#"]');
  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      const href = item.getAttribute('href');
      if (href.startsWith('#')) {
        e.preventDefault();
        const targetId = href.substring(1);
        const target = document.getElementById(targetId);
        if (target) {
          window.scrollTo({ top: target.offsetTop - 60, behavior: 'smooth' });
          navItems.forEach(nav => nav.classList.remove('active'));
          item.classList.add('active');
        }
      }
    });
  });
  
  if (elements.linkInput) {
    elements.linkInput.focus();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}


