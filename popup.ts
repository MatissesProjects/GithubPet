import { CollectionPet } from './engine.js';
import { monthNames } from './config.js';

async function getCurrentUser(): Promise<string | null> {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const tab = tabs[0];
    if (tab && tab.url) {
        try {
            const url = new URL(tab.url);
            if (url.hostname === 'github.com') {
                const parts = url.pathname.split('/').filter(p => p.length > 0);
                if (parts.length > 0) {
                    const reserved = ['settings', 'orgs', 'organizations', 'notifications', 'search', 'explore', 'marketplace', 'trending'];
                    if (!reserved.includes(parts[0])) return parts[0];
                }
            }
        } catch (e) {}
    }
    return null;
}

async function renderCollection() {
    const container = document.getElementById('collection-list');
    const statusEl = document.getElementById('status');
    if (!container || !statusEl) return;

    const user = await getCurrentUser();
    if (!user) {
        statusEl.textContent = 'Visit a GitHub profile to see pets!';
        return;
    }

    const { petCollection = {}, viewedYear = "" } = await (chrome.storage.local.get(['petCollection', 'viewedYear']) as any);
    
    // Filter for current user AND viewed year
    const userPets = Object.entries(petCollection)
        .filter(([_, data]: [string, any]) => {
            return data.username === user && (!viewedYear || data.year === viewedYear);
        })
        .sort((a, b) => {
            const petA = a[1] as CollectionPet;
            const petB = b[1] as CollectionPet;
            
            // Sort by year descending
            if (petA.year !== petB.year) {
                return petB.year.localeCompare(petA.year);
            }
            
            // Sort by month descending
            const monthA = monthNames.indexOf(petA.month);
            const monthB = monthNames.indexOf(petB.month);
            return monthB - monthA;
        });

    if (userPets.length === 0) {
        statusEl.textContent = `No pets found for ${user} in ${viewedYear || 'this year'}. Load a graph!`;
        container.innerHTML = '';
        return;
    }

    statusEl.textContent = `Pets for ${user} (${viewedYear}):`;
    container.innerHTML = '';

    userPets.forEach(([id, data]) => {
        const petData = data as CollectionPet;
        const item = document.createElement('div');
        item.className = 'collection-item';
        item.style.cssText = "display:flex; justify-content:space-between; align-items:center; padding:8px; border-bottom:1px solid #30363d; font-size:12px;";
        
        item.innerHTML = `
            <span><strong>${petData.month}</strong></span>
            <button id="toggle-${id}" style="padding:4px 8px; cursor:pointer; background:#21262d; color:#c9d1d9; border:1px solid #30363d; border-radius:4px;">
                ${petData.enabled ? 'Disable' : 'Enable'}
            </button>
        `;
        
        container.appendChild(item);

        const btn = item.querySelector(`#toggle-${id}`) as HTMLButtonElement;
        btn.onclick = async () => {
            petCollection[id].enabled = !petCollection[id].enabled;
            await chrome.storage.local.set({ petCollection });
            renderCollection();
        };
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const header = document.querySelector('h3');
    if (header) {
        const resetBtn = document.createElement('button');
        resetBtn.textContent = '🗑️';
        resetBtn.title = "Clear all discovered pets";
        resetBtn.style.cssText = "float:right; font-size:12px; background:none; border:none; cursor:pointer;";
        resetBtn.onclick = async () => {
            if (confirm("Clear all discovered pets?")) {
                await chrome.storage.local.set({ petCollection: {} });
                renderCollection();
            }
        };
        header.appendChild(resetBtn);
    }
    renderCollection();
});
